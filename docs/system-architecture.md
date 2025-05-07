# System Architecture

```mermaid
flowchart TD
    subgraph "Client Application"
        A[UI Layer]
        B[Encryption/Decryption Module]
        C[Local Storage]
        D[API Client]
    end
    
    subgraph "Backend Server"
        E[API Server]
        F[Authentication Service]
        G[User Management]
        H[Company Registration]
        I[Secret Management]
        J[Database]
    end
    
    A <--> B
    A <--> C
    A <--> D
    D <--> E
    E <--> F
    E <--> G
    E <--> H
    E <--> I
    F <--> J
    G <--> J
    H <--> J
    I <--> J
    
    %% Data storage
    C -. "Stores Private Keys\n(Encrypted)" .-> C
    J -. "Stores Public Keys,\nUser Info,\nEncrypted Secrets" .-> J