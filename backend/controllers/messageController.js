/**
 * Message Controller
 * Handles contact form messages using SQLite
 */

const { query, queryOne, run } = require('../config/database');

// Get all messages (Admin only)
exports.getAllMessages = async (req, res) => {
  try {
    console.log('📧 [MESSAGE] Fetching all messages');
    
    const messages = await query('SELECT * FROM messages ORDER BY created_at DESC');
    
    // Format messages to match expected structure
    const formattedMessages = messages.map(msg => ({
      _id: msg.id,
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      isRead: msg.isRead === 1,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    }));
    
    console.log(`✅ [MESSAGE] Found ${formattedMessages.length} messages`);
    
    res.json(formattedMessages);
  } catch (error) {
    console.error('❌ [MESSAGE] Error fetching messages:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch messages' 
    });
  }
};

// Get single message by ID (Admin only)
exports.getMessageById = async (req, res) => {
  try {
    const messageId = req.params.id;
    console.log('🔍 [MESSAGE] Fetching message:', messageId);
    
    const message = await queryOne('SELECT * FROM messages WHERE id = ?', [messageId]);
    
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    const formattedMessage = {
      _id: message.id,
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      isRead: message.isRead === 1,
      createdAt: message.created_at,
      updatedAt: message.updated_at
    };
    
    res.json(formattedMessage);
  } catch (error) {
    console.error('❌ [MESSAGE] Error fetching message:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch message' 
    });
  }
};

// Create new message (from contact form)
exports.createMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    console.log('📝 [MESSAGE] Creating new message from:', email);
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }
    
    const insertSql = `
      INSERT INTO messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await run(insertSql, [
      name.trim(),
      email.toLowerCase().trim(),
      subject.trim(),
      message.trim()
    ]);
    
    // Get created message
    const newMessage = await queryOne('SELECT * FROM messages WHERE id = ?', [result.lastID]);
    
    const formattedMessage = {
      _id: newMessage.id,
      name: newMessage.name,
      email: newMessage.email,
      subject: newMessage.subject,
      message: newMessage.message,
      isRead: newMessage.isRead === 1,
      createdAt: newMessage.created_at,
      updatedAt: newMessage.updated_at
    };
    
    console.log('✅ [MESSAGE] Message created successfully:', result.lastID);
    
    res.status(201).json({ 
      success: true,
      message: 'Message sent successfully', 
      data: formattedMessage 
    });
  } catch (error) {
    console.error('❌ [MESSAGE] Error creating message:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to send message' 
    });
  }
};

// Mark message as read (Admin only)
exports.markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    console.log('✅ [MESSAGE] Marking message as read:', messageId);
    
    const updateSql = 'UPDATE messages SET isRead = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await run(updateSql, [messageId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    // Get updated message
    const message = await queryOne('SELECT * FROM messages WHERE id = ?', [messageId]);
    
    const formattedMessage = {
      _id: message.id,
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      isRead: message.isRead === 1,
      createdAt: message.created_at,
      updatedAt: message.updated_at
    };
    
    res.json(formattedMessage);
  } catch (error) {
    console.error('❌ [MESSAGE] Error marking message as read:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to update message' 
    });
  }
};

// Delete message (Admin only)
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    console.log('🗑️ [MESSAGE] Deleting message:', messageId);
    
    const deleteSql = 'DELETE FROM messages WHERE id = ?';
    const result = await run(deleteSql, [messageId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error('❌ [MESSAGE] Error deleting message:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete message' 
    });
  }
};
