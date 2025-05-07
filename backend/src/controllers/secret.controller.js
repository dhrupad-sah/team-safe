const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create a new secret
const createSecret = async (req, res) => {
  try {
    const { id: senderId } = req.user;
    const { receiverId, encryptedData } = req.body;
    
    // Validate required fields
    if (!receiverId || !encryptedData) {
      return res.status(400).json({ message: 'Receiver ID and encrypted data are required' });
    }
    
    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });
    
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Create the secret
    const secret = await prisma.secret.create({
      data: {
        encryptedData,
        senderId,
        receiverId
      }
    });
    
    return res.status(201).json({
      message: 'Secret shared successfully',
      secretId: secret.id
    });
  } catch (error) {
    console.error('Error creating secret:', error);
    return res.status(500).json({ message: 'Failed to share secret' });
  }
};

// Get all secrets for the current user (sent and received)
const getSecrets = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { type = 'all' } = req.query;
    
    let whereClause = {};
    
    // Filter by sent, received, or all
    if (type === 'sent') {
      whereClause = { senderId: userId };
    } else if (type === 'received') {
      whereClause = { receiverId: userId };
    } else {
      // 'all' - both sent and received
      whereClause = {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      };
    }
    
    const secrets = await prisma.secret.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json(secrets);
  } catch (error) {
    console.error('Error fetching secrets:', error);
    return res.status(500).json({ message: 'Failed to fetch secrets' });
  }
};

// Get a specific secret by ID
const getSecretById = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { id: secretId } = req.params;
    
    const secret = await prisma.secret.findUnique({
      where: { id: Number(secretId) },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!secret) {
      return res.status(404).json({ message: 'Secret not found' });
    }
    
    // Check if user is allowed to access this secret
    if (secret.senderId !== userId && secret.receiverId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    return res.status(200).json(secret);
  } catch (error) {
    console.error('Error fetching secret:', error);
    return res.status(500).json({ message: 'Failed to fetch secret' });
  }
};

// Mark a secret as read
const markAsRead = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { id: secretId } = req.params;
    
    const secret = await prisma.secret.findUnique({
      where: { id: Number(secretId) }
    });
    
    if (!secret) {
      return res.status(404).json({ message: 'Secret not found' });
    }
    
    // Check if user is the receiver
    if (secret.receiverId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update the secret as read
    const updatedSecret = await prisma.secret.update({
      where: { id: Number(secretId) },
      data: { isRead: true }
    });
    
    return res.status(200).json({
      message: 'Secret marked as read',
      secretId: updatedSecret.id
    });
  } catch (error) {
    console.error('Error marking secret as read:', error);
    return res.status(500).json({ message: 'Failed to update secret' });
  }
};

module.exports = {
  createSecret,
  getSecrets,
  getSecretById,
  markAsRead
}; 