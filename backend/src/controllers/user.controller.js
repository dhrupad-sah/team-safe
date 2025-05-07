const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Get all users from the same company
const getCompanyUsers = async (req, res) => {
  try {
    const { id: userId, companyId } = req.user;
    
    const users = await prisma.user.findMany({
      where: {
        companyId,
        id: { not: userId } // Exclude the current user
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        publicKey: true
      }
    });
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching company users:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get current user's profile
const getUserProfile = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { firstName, lastName, currentPassword, newPassword } = req.body;
    
    // Data to update
    const updateData = {};
    
    // Update name if provided
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    
    // If changing password, verify current password first
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    return res.status(200).json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = {
  getCompanyUsers,
  getUserProfile,
  updateUserProfile
}; 