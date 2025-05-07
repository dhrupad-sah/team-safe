const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const { menubar } = require('menubar');
const fs = require('fs');

// Check if the app is in test mode (for two instances)
const isTestMode = process.argv.includes('--test-mode');

// Enable hot reload in development mode
try {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.log('Running in development mode with hot reload enabled');
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '../../node_modules', '.bin', 'electron'),
      awaitWriteFinish: true,
      ignored: /node_modules|[/\\]\./
    });
  }
} catch (err) {
  console.error('Could not set up hot reload:', err);
}

// Prevent Electron from crashing on certain errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let secondWindow;

// Get the HTML path using the app's path for more reliable resolution
const getHtmlPath = () => {
  const appPath = app.getAppPath();
  const htmlPath = path.join(appPath, 'src', 'renderer', 'index.html');
  console.log('App path:', appPath);
  console.log('HTML path:', htmlPath);
  
  // Check if the HTML file exists
  if (fs.existsSync(htmlPath)) {
    console.log('HTML file exists');
  } else {
    console.error('HTML file does not exist at', htmlPath);
  }
  
  return htmlPath;
};

// Function to create a browser window for testing
function createTestWindow(x, y, title, partition) {
  console.log(`Creating test window: ${title}`);
  
  const win = new BrowserWindow({
    width: 380,
    height: 600,
    x: x,
    y: y,
    title: title,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // In production, this should be true
      devTools: true,
      partition: partition // Use a different partition for each window to isolate localStorage
    }
  });

  // Set CSP headers to allow API requests before loading the URL
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://localhost:3001; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3001; style-src 'self' 'unsafe-inline'"
        ]
      }
    });
  });

  // Log when page finishes loading
  win.webContents.on('did-finish-load', () => {
    console.log(`Window "${title}" loaded successfully`);
  });
  
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Window "${title}" failed to load:`, errorDescription);
  });

  // Handle console messages from the renderer process
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[${title} Console]: ${message}`);
  });

  // Use file URL format instead of loadFile for consistency
  const htmlPath = getHtmlPath();
  const fileUrl = `file://${htmlPath}`;
  console.log(`Loading ${title} from: ${fileUrl}`);
  win.loadURL(fileUrl);
  
  win.webContents.openDevTools({ mode: 'detach' });

  return win;
}

async function createMenuBar() {
  // Using dynamic import for electron-is-dev
  const isDev = (await import('electron-is-dev')).default;
  console.log('Creating menubar...');
  
  const mb = menubar({
    index: `file://${getHtmlPath()}`,
    // Use Electron's default tray icon for now
    // icon: path.join(__dirname, '../../assets/iconTemplate.png'),
    browserWindow: {
      width: 380,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false, // Allow loading local resources
        devTools: true
      },
    },
    showOnAllWorkspaces: false,
    preloadWindow: true,
  });

  mb.on('ready', () => {
    console.log('Team Safe is ready');
  });

  mb.on('after-create-window', () => {
    if (isDev) {
      mb.window.openDevTools({ mode: 'detach' });
    }
    
    // Set CSP headers to allow API requests
    mb.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' http://localhost:3001; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3001; style-src 'self' 'unsafe-inline'"
          ]
        }
      });
    });
    
    // Handle console messages from the renderer process
    mb.window.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[Menubar Console]: ${message}`);
    });
  });

  return mb;
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('App is ready');
  
  // Register file protocol for more reliable file loading
  protocol.registerFileProtocol('file', (request, callback) => {
    const url = request.url.replace('file://', '');
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      console.error('Protocol error:', error);
    }
  });
  
  if (isTestMode) {
    // In test mode, create two windows side by side for testing
    console.log('Running in test mode with two windows');
    mainWindow = createTestWindow(50, 100, 'Team Safe - User 1', 'persist:user1');
    secondWindow = createTestWindow(450, 100, 'Team Safe - User 2', 'persist:user2');
    
    // No need to clear storage data since we're using different partitions
  } else {
    // Normal mode - use menubar
    createMenuBar();
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      if (isTestMode) {
        mainWindow = createTestWindow(50, 100, 'Team Safe - User 1', 'persist:user1');
        secondWindow = createTestWindow(450, 100, 'Team Safe - User 2', 'persist:user2');
      } else {
        createMenuBar();
      }
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 