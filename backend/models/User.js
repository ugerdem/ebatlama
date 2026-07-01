const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  if (!this.password) return false;

  // Legacy kullanıcı kayıtları plain text olarak kalmış olabilir.
  // Bcrypt hash ise normal karşılaştırma yap, değilse düz metin eşleşmesini dene.
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$')) {
    return bcrypt.compare(plain, this.password);
  }

  return plain === this.password;
};

userSchema.methods.toSafeJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    name: this.name,
    role: this.role,
    active: this.active
  };
};

module.exports = mongoose.model('User', userSchema);