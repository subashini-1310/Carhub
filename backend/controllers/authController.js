const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper to ensure MongoDB is ready
const ensureDbConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      const uri = process.env.MONGO_URI || 'mongodb://subashinisakthivel2020_db_user:iGsTZBMLo3cdOaTu@ac-5m2ilhz-shard-00-00.yl3ywei.mongodb.net:27017,ac-5m2ilhz-shard-00-01.yl3ywei.mongodb.net:27017,ac-5m2ilhz-shard-00-02.yl3ywei.mongodb.net:27017/carhub?ssl=true&replicaSet=atlas-j5cbg6-shard-0&authSource=admin&retryWrites=true&w=majority';
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log('[CarHub DB] MongoDB Connection Restored.');
    } catch (err) {
      console.error('[CarHub DB Connection Error]', err.message);
    }
  }
};

// Default password hash for seed users ('password123')
const defaultHash = bcrypt.hashSync('password123', 10);

// In-Memory store fallback
const inMemoryUsers = [
  { id: 'usr-admin', name: 'CarHub Admin', email: 'admin@carhub.com', password: defaultHash, role: 'Admin', city: 'Chennai' },
  { id: 'usr-buyer', name: 'Rahul Customer', email: 'buyer@gmail.com', password: defaultHash, role: 'Buyer / Renter', city: 'Chennai' },
  { id: 'usr-seller', name: 'Ramesh Seller', email: 'seller@gmail.com', password: defaultHash, role: 'Seller', city: 'Chennai' }
];

const getRoleRegexPattern = (role) => {
  const r = (role || 'Buyer / Renter').toLowerCase();
  if (r.includes('buyer') || r.includes('renter')) {
    return '^(Buyer / Renter|Buyer|Renter)$';
  }
  return `^${role}$`;
};

const isMatchingRole = (userRole, targetRole) => {
  const u = (userRole || '').toLowerCase();
  const t = (targetRole || 'Buyer / Renter').toLowerCase();
  if ((u.includes('buyer') || u.includes('renter')) && (t.includes('buyer') || t.includes('renter'))) {
    return true;
  }
  return u === t;
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, adminCode, city, phone } = req.body;
    
    if (role === 'Admin' && adminCode !== 'admin123') {
      return res.status(400).json({ message: "Invalid Admin Authorization Code. Enter 'admin123'." });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const selectedRole = role || 'Buyer / Renter';

    await ensureDbConnection();

    // Check if user already exists in MongoDB
    let existingUser = null;
    try {
      existingUser = await User.findOne({ 
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });
    } catch (queryErr) {
      console.warn('[CarHub DB Find User Warning]', queryErr.message);
    }

    if (existingUser) {
      return res.status(400).json({ message: `An account with this email is already registered. Please log in directly.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = null;
    try {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: selectedRole,
        city: city || 'Chennai',
        phone: phone || '+91 9876543210',
        authProvider: 'local'
      });
      console.log(`[CarHub DB] Successfully stored new user in MongoDB: ${user.email} (${user.role}) - _id: ${user._id}`);
    } catch (createErr) {
      console.error('[CarHub DB User.create Error]', createErr);
      if (createErr.code === 11000) {
        return res.status(400).json({ message: `An account with this email is already registered. Please log in.` });
      }
      throw createErr;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      'CARHUB_JWT_SECRET',
      { expiresIn: '7d' }
    );
    
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        phone: user.phone,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('[CarHub Register Error]', error);
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await ensureDbConnection();

    let user = null;
    let isDbUser = false;
    try {
      user = await User.findOne({ 
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });
      if (user) isDbUser = true;
    } catch (e) {
      console.warn('[CarHub DB Login Warning]', e.message);
    }

    if (!user) {
      user = inMemoryUsers.find(
        u => u.email.toLowerCase() === normalizedEmail
      );
    }

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email. Please register first.' });
    }

    // Password Verification Check
    let isPasswordValid = false;
    if (isDbUser && user.password) {
      isPasswordValid = await bcrypt.compare(password || '', user.password);
    } else if (user.password) {
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isPasswordValid = await bcrypt.compare(password || '', user.password);
      } else {
        isPasswordValid = (user.password === password);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password. Please check your credentials.' });
    }

    const token = jwt.sign(
      { id: user._id || user.id, role: user.role, name: user.name, email: user.email }, 
      'CARHUB_JWT_SECRET', 
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city || 'Chennai',
        phone: user.phone || '+91 9876543210',
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential, email, name, avatar, googleId, role, adminCode } = req.body;

    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGoogleId = googleId;

    // Decode Google ID Token if passed from Google Identity Services
    if (credential && !userEmail) {
      try {
        const payloadBase64 = credential.split('.')[1];
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const payload = JSON.parse(decodedJson);
        userEmail = payload.email;
        userName = payload.name || payload.given_name;
        userAvatar = payload.picture;
        userGoogleId = payload.sub;
      } catch (decodeErr) {
        console.warn('Failed to parse Google credential token payload:', decodeErr.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'Valid Google email is required.' });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const targetRole = role || 'Buyer / Renter';

    if (targetRole === 'Admin' && adminCode !== 'admin123' && normalizedEmail !== 'admin@carhub.com') {
      return res.status(400).json({ message: "Admin authorization code 'admin123' is required for Admin role." });
    }

    await ensureDbConnection();

    let user = null;
    try {
      user = await User.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });

      if (!user) {
        user = await User.create({
          name: userName || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          password: '',
          role: (normalizedEmail === 'admin@carhub.com') ? 'Admin' : targetRole,
          city: 'Chennai',
          phone: '+91 9876543210',
          avatar: userAvatar || '',
          googleId: userGoogleId || '',
          authProvider: 'google'
        });
        console.log(`[CarHub DB] Successfully stored Google user in MongoDB: ${user.email} (${user.role}) - _id: ${user._id}`);
      } else {
        if (userAvatar && !user.avatar) {
          user.avatar = userAvatar;
        }
        if (!user.authProvider || user.authProvider === 'local') {
          user.authProvider = 'google';
        }
        await user.save();
        console.log(`[CarHub DB] Existing Google user logged in from MongoDB: ${user.email} (${user.role})`);
      }
    } catch (e) {
      console.error('[CarHub DB Google Auth Exception]', e);
      // Fallback
      user = inMemoryUsers.find(
        u => u.email.toLowerCase() === normalizedEmail && isMatchingRole(u.role, targetRole)
      );
      if (!user) {
        user = {
          id: `usr-${Date.now()}`,
          name: userName || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          password: '',
          role: targetRole,
          city: 'Chennai',
          phone: '+91 9876543210',
          avatar: userAvatar || '',
          googleId: userGoogleId || '',
          authProvider: 'google'
        };
        inMemoryUsers.push(user);
      }
    }

    const token = jwt.sign(
      { id: user._id || user.id, role: user.role, name: user.name, email: user.email },
      'CARHUB_JWT_SECRET',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city || 'Chennai',
        phone: user.phone || '+91 9876543210',
        avatar: user.avatar || userAvatar || ''
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, googleLogin };
