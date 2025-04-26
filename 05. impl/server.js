const mysql = require('mysql2/promise');
require('dotenv').config();

// // Log environment variables for debugging
// console.log('Environment variables:');
// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_USER:', process.env.DB_USER);
// console.log('DB_NAME:', process.env.DB_NAME);
// console.log('DB_PORT:', process.env.DB_PORT);

// Create a connection without specifying a database
async function initializeDatabase() {
  const initialConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };
  
  try {
    // Create a connection without specifying database
    const connection = await mysql.createConnection(initialConfig);
    console.log('Connected to MySQL server');
    
    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS projectx;`);
    
    // Close initial connection
    await connection.end();
    console.log('Initial setup complete');
    
    // Now connect with the full config including database
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'projectx',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// console.log('Using database configuration:', dbConfig);

// Create a connection pool
let pool;

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    process.exit(1); // Exit if cannot connect to database
  }
}

// Initialize connection and set up server
async function initialize() {
  try {
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      pool = mysql.createPool(dbConfig);
      await testConnection();

      // Verify admin table exists and has correct structure
      try {
        const [adminTable] = await pool.query(`
          SELECT * FROM information_schema.tables 
          WHERE table_schema = ? AND table_name = 'admin'
        `, [dbConfig.database]);

        if (adminTable.length === 0) {
          console.log('Creating admin table...');
          await pool.query(`
            CREATE TABLE IF NOT EXISTS admin (
              idadmin INT AUTO_INCREMENT PRIMARY KEY,
              fname VARCHAR(45) NOT NULL,
              lname VARCHAR(45) NOT NULL,
              email VARCHAR(45),
              username VARCHAR(45) NOT NULL UNIQUE,
              password VARCHAR(45) NOT NULL,
              contact_n VARCHAR(45)
            )
          `);
          console.log('Admin table created successfully');

          // Insert a default admin user
          await pool.query(`
            INSERT INTO admin (fname, lname, email, username, password, contact_n)
            VALUES ('Admin', 'User', 'admin@example.com', 'admin', 'admin123', '1234567890')
          `);
          console.log('Default admin user created');
        } else {
          console.log('Admin table exists');
        }
        
        // Create devices table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS devices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            deviceId VARCHAR(100) NOT NULL,
            deviceName VARCHAR(100) NOT NULL,
            modelName VARCHAR(100),
            osName VARCHAR(45),
            osVersion VARCHAR(45),
            ownerId INT NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            registeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('Devices table checked/created');
        
        // Create user_logs table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            username VARCHAR(45) NOT NULL,
            action VARCHAR(45) NOT NULL,
            role VARCHAR(45) NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('User logs table checked/created');
        
        // Check if student table exists and set AUTO_INCREMENT to 1 if it does
        const [studentTable] = await pool.query(`
          SELECT * FROM information_schema.tables 
          WHERE table_schema = ? AND table_name = 'student'
        `, [dbConfig.database]);
        
        if (studentTable.length > 0) {
          console.log('Student table exists, ensuring AUTO_INCREMENT starts from 1');
          await pool.query(`ALTER TABLE student AUTO_INCREMENT = 1`);
        }
        
        // Check if lecturer table exists and set AUTO_INCREMENT to 1 if it does
        const [lecturerTable] = await pool.query(`
          SELECT * FROM information_schema.tables 
          WHERE table_schema = ? AND table_name = 'lecturer'
        `, [dbConfig.database]);
        
        if (lecturerTable.length > 0) {
          console.log('Lecturer table exists, ensuring AUTO_INCREMENT starts from 1');
          await pool.query(`ALTER TABLE lecturer AUTO_INCREMENT = 1`);
        }
        
      } catch (tableError) {
        console.error('Error checking/creating tables:', tableError);
      }

      // Start your Express server here after successful DB init
      startServer();
    } else {
      console.error('Database initialization failed. Exiting.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

// --- Express Server Setup ---
const express = require('express');
const cors = require('cors');
// const bcrypt = require('bcrypt'); // Removed as bcrypt is not currently used for plain text comparison

const app = express();
const port = process.env.PORT || 3001; // Use a different port than the React Native dev server

// Configure CORS to accept all origins for React Native
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Parse JSON request bodies

// Add a test endpoint to verify server connection
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  
  console.log('Login attempt:', { username, role });

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, and role are required' });
  }

  try {
    let tableName, idField, usernameField;
    
    // Determine table and field names based on role
    switch(role) {
      case 'admin':
        tableName = 'admin';
        idField = 'idadmin';
        usernameField = 'username';  // admin table uses username
        break;
      case 'lecturer':
        tableName = 'lecturer';
        idField = 'id_lecturer';
        usernameField = 'username';
        break;
      case 'student':
        tableName = 'student';
        idField = 'id_student';
        usernameField = 'username';
        break;
      default:
        return res.status(400).json({ message: 'Invalid role' });
    }
    
    console.log(`Attempting to query ${tableName} table with username field: ${usernameField}`);
    
    // Query to check if user exists and password matches
    const query = `SELECT * FROM ${tableName} WHERE ${usernameField} = ? AND password = ?`;
    console.log('Executing query:', query);
    
    const [rows] = await pool.query(query, [username, password]);
    
    console.log(`Query result count: ${rows.length}`);

    if (rows.length === 0) {
      // Log failed login attempt
      await pool.query(
        `INSERT INTO user_logs (user_id, username, action, role) 
         VALUES (0, ?, 'LOGIN_FAILED', ?)`,
        [username, role]
      );
      
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    console.log('Found user:', { ...user, password: '[REDACTED]' });

    // Log successful login
    await pool.query(
      `INSERT INTO user_logs (user_id, username, action, role) 
       VALUES (?, ?, 'LOGIN_SUCCESS', ?)`,
      [user[idField], username, role]
    );

    // Map database fields to response fields
    const userData = {
      id: user[idField],
      username: user[usernameField],
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      contactnumber: role === 'admin' ? user.contact_n : user.contactnumber,
      role: role
    };

    console.log('Login successful. Sending user data:', { ...userData, id: '[REDACTED]' });
    
    res.json({
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error details:', {
      error: error.message,
      stack: error.stack,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      } : undefined
    });
  }
});

// Add logout endpoint
app.post('/logout', async (req, res) => {
  const { userId, username, role } = req.body;

  try {
    // Log the logout action
    await pool.query(
      `INSERT INTO user_logs (user_id, username, action, role) 
       VALUES (?, ?, 'LOGOUT', ?)`,
      [userId, username, role]
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
});

// Add user creation endpoint
app.post('/users', async (req, res) => {
  const { fname, lname, email, user_name, password, contact_n, studentID, department, courses, status, role } = req.body;
  
  console.log('User creation attempt:', { fname, lname, email, user_name, role });

  // Validate required fields
  if (!fname || !lname || !user_name || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate role
  if (!['student', 'lecturer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be either student or lecturer' });
  }

  try {
    let tableName, idField;
    let createTableQuery;
    
    // Set up table-specific configurations
    if (role === 'lecturer') {
      tableName = 'lecturer';
      idField = 'id_lecturer';
      createTableQuery = `
        CREATE TABLE IF NOT EXISTS lecturer (
          id_lecturer INT AUTO_INCREMENT PRIMARY KEY,
          fname VARCHAR(45) NOT NULL,
          lname VARCHAR(45) NOT NULL,
          email VARCHAR(45),
          username VARCHAR(45) NOT NULL UNIQUE,
          password VARCHAR(45) NOT NULL,
          contactnumber VARCHAR(45),
          department VARCHAR(100),
          courses TEXT,
          status ENUM('active', 'on leave', 'inactive') DEFAULT 'active'
        ) AUTO_INCREMENT = 1
      `;
    } else {
      tableName = 'student';
      idField = 'id_student';
      createTableQuery = `
        CREATE TABLE IF NOT EXISTS student (
          id_student INT AUTO_INCREMENT PRIMARY KEY,
          fname VARCHAR(45) NOT NULL,
          lname VARCHAR(45) NOT NULL,
          email VARCHAR(45),
          username VARCHAR(45) NOT NULL UNIQUE,
          password VARCHAR(45) NOT NULL,
          contactnumber VARCHAR(45),
          studentID VARCHAR(45)
        ) AUTO_INCREMENT = 1
      `;
    }

    // Create table if it doesn't exist
    await pool.query(createTableQuery);

    // Always ensure the auto_increment is set to 1 if it's the student table
    if (role === 'student') {
      await pool.query(`ALTER TABLE student AUTO_INCREMENT = 1`);
    }
    
    // Always ensure the auto_increment is set to 1 if it's the lecturer table
    if (role === 'lecturer') {
      await pool.query(`ALTER TABLE lecturer AUTO_INCREMENT = 1`);
    }

    // Check if username already exists
    const [existingUsers] = await pool.query(
      `SELECT username FROM ${tableName} WHERE username = ?`,
      [user_name]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // For lecturer role, we need to handle the courses array
    let coursesJSON = null;
    if (role === 'lecturer' && courses) {
      coursesJSON = JSON.stringify(courses);
    }

    // Insert new user
    let query, queryParams;
    
    if (role === 'lecturer') {
      query = `INSERT INTO ${tableName} (fname, lname, email, username, password, contactnumber, department, courses, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      queryParams = [
        fname, 
        lname, 
        email || null, 
        user_name, 
        password, 
        contact_n || null, 
        department || null, 
        coursesJSON, 
        status || 'active'
      ];
    } else {
      query = `INSERT INTO ${tableName} (fname, lname, email, username, password, contactnumber, studentID)
              VALUES (?, ?, ?, ?, ?, ?, ?)`;
      queryParams = [
        fname, 
        lname, 
        email || null, 
        user_name, 
        password, 
        contact_n || null, 
        studentID || null
      ];
    }

    const [result] = await pool.query(query, queryParams);

    // Log user creation
    await pool.query(
      `INSERT INTO user_logs (user_id, username, action, role) 
       VALUES (?, ?, 'USER_CREATED', ?)`,
      [result.insertId, user_name, role]
    );

    console.log('User created successfully:', { 
      id: result.insertId, 
      role,
      ...(role === 'student' && { 
        studentID: req.body.studentID || null,
        message: 'Auto-increment should start from 1'
      })
    });

    // Prepare response based on role
    let userData;
    if (role === 'lecturer') {
      userData = {
        id: result.insertId,
        fname,
        lname,
        email,
        username: user_name,
        contactnumber: contact_n,
        department,
        courses: courses || [],
        status: status || 'active',
        role
      };
    } else {
      userData = {
        id: result.insertId,
        fname,
        lname,
        email,
        username: user_name,
        contactnumber: contact_n,
        role,
        ...(role === 'student' && { studentID: req.body.studentID || null })
      };
    }

    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ 
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add devices endpoints
app.post('/devices', async (req, res) => {
  const { deviceId, deviceName, modelName, osName, osVersion, ownerId, status } = req.body;
  
  console.log('Device registration attempt:', { deviceId, deviceName, ownerId });

  if (!deviceName || !ownerId) {
    return res.status(400).json({ message: 'Device name and owner ID are required' });
  }

  try {
    // First check if the device with this ID already exists
    const [existingDevices] = await pool.query(
      `SELECT * FROM devices WHERE deviceId = ?`,
      [deviceId]
    );

    if (existingDevices.length > 0) {
      return res.status(400).json({ message: 'Device already registered' });
    }
    
    // Insert the new device
    const [result] = await pool.query(
      `INSERT INTO devices (deviceId, deviceName, modelName, osName, osVersion, ownerId, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [deviceId, deviceName, modelName || 'Unknown', osName || 'Unknown', osVersion || 'Unknown', ownerId, status || 'active']
    );

    // Get owner name for response
    let ownerName = 'Unknown';
    try {
      const [ownerRows] = await pool.query(
        `SELECT fname, lname FROM admin WHERE idadmin = ? 
         UNION 
         SELECT fname, lname FROM lecturer WHERE id_lecturer = ? 
         UNION 
         SELECT fname, lname FROM student WHERE id_student = ?`,
        [ownerId, ownerId, ownerId]
      );
      
      if (ownerRows.length > 0) {
        ownerName = `${ownerRows[0].fname} ${ownerRows[0].lname}`;
      }
    } catch (error) {
      console.error('Error getting owner name:', error);
    }

    console.log('Device registered successfully:', { id: result.insertId });

    res.status(201).json({
      message: 'Device registered successfully',
      device: {
        id: result.insertId,
        deviceId,
        deviceName,
        modelName: modelName || 'Unknown',
        osName: osName || 'Unknown',
        osVersion: osVersion || 'Unknown',
        ownerId,
        ownerName,
        status: status || 'active',
        registeredAt: new Date()
      }
    });

  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ 
      message: 'Error registering device',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all devices
app.get('/devices', async (req, res) => {
  try {
    // Get all devices with owner names joined
    const [devices] = await pool.query(`
      SELECT d.*, 
        CONCAT(COALESCE(a.fname, ''), ' ', COALESCE(a.lname, '')) as ownerName 
      FROM devices d
      LEFT JOIN admin a ON d.ownerId = a.idadmin
      UNION
      SELECT d.*, 
        CONCAT(COALESCE(l.fname, ''), ' ', COALESCE(l.lname, '')) as ownerName 
      FROM devices d
      LEFT JOIN lecturer l ON d.ownerId = l.id_lecturer
      UNION
      SELECT d.*, 
        CONCAT(COALESCE(s.fname, ''), ' ', COALESCE(s.lname, '')) as ownerName 
      FROM devices d
      LEFT JOIN student s ON d.ownerId = s.id_student
      ORDER BY id
    `);

    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ 
      message: 'Error fetching devices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update device status
app.put('/devices/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be active or inactive' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE devices SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({ message: `Device ${status} successfully` });
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({ message: 'Error updating device status' });
  }
});

// Delete device
app.delete('/devices/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `DELETE FROM devices WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Error deleting device' });
  }
});

// Get all users route
app.get('/users', async (req, res) => {
  try {
    // Combine users from different tables
    const [adminRows] = await pool.query(`
      SELECT 
        idadmin as id, 
        fname, 
        lname, 
        email, 
        username as user_name, 
        contact_n, 
        'admin' as role,
        'active' as status
      FROM admin
    `);
    
    const [lecturerRows] = await pool.query(`
      SELECT 
        id_lecturer as id, 
        fname, 
        lname, 
        email, 
        username as user_name, 
        contactnumber as contact_n, 
        department,
        courses,
        status,
        'lecturer' as role
      FROM lecturer
    `);
    
    // Process lecturer rows to parse courses from JSON
    const processedLecturerRows = lecturerRows.map(lecturer => {
      try {
        if (lecturer.courses) {
          lecturer.courses = JSON.parse(lecturer.courses);
        } else {
          lecturer.courses = [];
        }
      } catch (error) {
        lecturer.courses = [];
      }
      return lecturer;
    });
    
    const [studentRows] = await pool.query(`
      SELECT 
        id_student as id, 
        fname, 
        lname, 
        email, 
        username as user_name, 
        contactnumber as contact_n, 
        'student' as role,
        'active' as status,
        studentID
      FROM student
    `);
    
    const users = [...adminRows, ...processedLecturerRows, ...studentRows];
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Delete user endpoint
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.query;

  if (!role) {
    return res.status(400).json({ message: 'Role is required' });
  }

  try {
    let tableName, idField;
    
    // Set up table-specific configurations
    if (role === 'lecturer') {
      tableName = 'lecturer';
      idField = 'id_lecturer';
    } else if (role === 'student') {
      tableName = 'student';
      idField = 'id_student';
    } else if (role === 'admin') {
      tableName = 'admin';
      idField = 'idadmin';
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user exists
    const [existingUsers] = await pool.query(
      `SELECT * FROM ${tableName} WHERE ${idField} = ?`,
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    const [result] = await pool.query(
      `DELETE FROM ${tableName} WHERE ${idField} = ?`,
      [id]
    );

    // Log user deletion
    await pool.query(
      `INSERT INTO user_logs (user_id, username, action, role) 
       VALUES (?, ?, 'USER_DELETED', ?)`,
      [id, existingUsers[0].username, role]
    );

    console.log(`${role} deleted successfully:`, { id });

    res.json({
      message: `${role} deleted successfully`
    });

  } catch (error) {
    console.error(`Error deleting ${role}:`, error);
    res.status(500).json({ 
      message: `Error deleting ${role}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add user update endpoint
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { fname, lname, email, user_name, password, contact_n, studentID, department, courses, status, role } = req.body;
  
  console.log(`Update ${role} attempt:`, { id, fname, lname, email, user_name });

  // Validate required fields
  if (!id || !role) {
    return res.status(400).json({ message: 'ID and role are required' });
  }

  // Validate role
  if (!['student', 'lecturer', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    let tableName, idField, contactField;
    
    // Set up table-specific configurations
    if (role === 'lecturer') {
      tableName = 'lecturer';
      idField = 'id_lecturer';
      contactField = 'contactnumber';
    } else if (role === 'student') {
      tableName = 'student';
      idField = 'id_student';
      contactField = 'contactnumber';
    } else {
      tableName = 'admin';
      idField = 'idadmin';
      contactField = 'contact_n';
    }

    // Check if user exists
    const [existingUsers] = await pool.query(
      `SELECT * FROM ${tableName} WHERE ${idField} = ?`,
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare update fields
    let updateFields = [];
    let updateValues = [];

    if (fname) {
      updateFields.push('fname = ?');
      updateValues.push(fname);
    }
    
    if (lname) {
      updateFields.push('lname = ?');
      updateValues.push(lname);
    }
    
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    
    if (user_name) {
      // Check if username already exists for a different user
      const [usernameCheck] = await pool.query(
        `SELECT * FROM ${tableName} WHERE username = ? AND ${idField} != ?`,
        [user_name, id]
      );
      
      if (usernameCheck.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      updateFields.push('username = ?');
      updateValues.push(user_name);
    }
    
    if (password) {
      updateFields.push('password = ?');
      updateValues.push(password);
    }
    
    if (contact_n) {
      updateFields.push(`${contactField} = ?`);
      updateValues.push(contact_n);
    }
    
    // Add studentID field update for students
    if (role === 'student' && studentID) {
      updateFields.push('studentID = ?');
      updateValues.push(studentID);
    }
    
    // Add lecturer-specific fields
    if (role === 'lecturer') {
      if (department) {
        updateFields.push('department = ?');
        updateValues.push(department);
      }
      
      if (courses) {
        updateFields.push('courses = ?');
        updateValues.push(JSON.stringify(courses));
      }
      
      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Add the id to the values array
    updateValues.push(id);

    // Update the user
    const [result] = await pool.query(
      `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE ${idField} = ?`,
      updateValues
    );

    // Log user update
    await pool.query(
      `INSERT INTO user_logs (user_id, username, action, role) 
       VALUES (?, ?, 'USER_UPDATED', ?)`,
      [id, existingUsers[0].username, role]
    );

    console.log(`${role} updated successfully:`, { id });

    // Get the updated user data
    const [updatedUser] = await pool.query(
      `SELECT * FROM ${tableName} WHERE ${idField} = ?`,
      [id]
    );

    // Process courses if it's a lecturer
    let processedCourses = [];
    if (role === 'lecturer' && updatedUser[0].courses) {
      try {
        processedCourses = JSON.parse(updatedUser[0].courses);
      } catch (e) {
        processedCourses = [];
      }
    }

    const userData = {
      id: updatedUser[0][idField],
      fname: updatedUser[0].fname,
      lname: updatedUser[0].lname,
      email: updatedUser[0].email,
      username: updatedUser[0].username,
      contactnumber: role === 'admin' ? updatedUser[0].contact_n : updatedUser[0].contactnumber,
      role: role,
      ...(role === 'student' && { studentID: updatedUser[0].studentID }),
      ...(role === 'lecturer' && { 
        department: updatedUser[0].department,
        courses: processedCourses,
        status: updatedUser[0].status
      })
    };

    res.json({
      message: `${role} updated successfully`,
      user: userData
    });

  } catch (error) {
    console.error(`Error updating ${role}:`, error);
    res.status(500).json({ 
      message: `Error updating ${role}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Classes API endpoints
app.post('/classes', async (req, res) => {
  const { classname, classcode, capacity } = req.body;
  
  console.log('Class creation attempt:', { classname, classcode, capacity });

  // Validate required fields
  if (!classname || !classcode) {
    return res.status(400).json({ message: 'Class name and code are required' });
  }

  try {
    // Create classes table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id_classes INT AUTO_INCREMENT PRIMARY KEY,
        classname VARCHAR(45) NOT NULL,
        classcode VARCHAR(45) NOT NULL,
        capacity VARCHAR(45)
      )
    `);

    // Insert the new class
    const [result] = await pool.query(
      `INSERT INTO classes (classname, classcode, capacity) VALUES (?, ?, ?)`,
      [classname, classcode, capacity || '30']
    );

    console.log('Class created successfully:', { id: result.insertId });

    res.status(201).json({
      message: 'Class created successfully',
      id: result.insertId,
      classname,
      classcode,
      capacity: capacity || '30'
    });

  } catch (error) {
    console.error('Class creation error:', error);
    res.status(500).json({ 
      message: 'Error creating class',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all classes
app.get('/classes', async (req, res) => {
  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id_classes INT AUTO_INCREMENT PRIMARY KEY,
        classname VARCHAR(45) NOT NULL,
        classcode VARCHAR(45) NOT NULL,
        capacity VARCHAR(45)
      )
    `);
    
    const [classes] = await pool.query('SELECT * FROM classes');
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Error fetching classes' });
  }
});

// Get a specific class
app.get('/classes/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [classes] = await pool.query('SELECT * FROM classes WHERE id_classes = ?', [id]);
    
    if (classes.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json(classes[0]);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ message: 'Error fetching class' });
  }
});

// Update a class
app.put('/classes/:id', async (req, res) => {
  const { id } = req.params;
  const { classname, classcode, capacity } = req.body;
  
  try {
    const [result] = await pool.query(
      'UPDATE classes SET classname = ?, classcode = ?, capacity = ? WHERE id_classes = ?',
      [classname, classcode, capacity, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json({ 
      message: 'Class updated successfully',
      id,
      classname,
      classcode,
      capacity
    });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Error updating class' });
  }
});

// Delete a class
app.delete('/classes/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [result] = await pool.query('DELETE FROM classes WHERE id_classes = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Error deleting class' });
  }
});

function startServer() {
  // Listen on all network interfaces (0.0.0.0) instead of just localhost
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
    console.log(`For local access use: http://localhost:${port}`);
    console.log(`Server is ready to accept connections from React Native`);
  });
}

initialize();

// Export the pool to be used in other files (if needed, though API is preferred)
module.exports = {
  getPool: () => pool,
  // testConnection // Not typically exported
};
