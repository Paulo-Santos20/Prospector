import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  placeId: { 
    type: String, 
    required: true, 
    unique: true, // Garante que não teremos duplicatas no banco
    index: true 
  },
  displayName: {
    text: String,
    languageCode: String
  },
  analysis: {
    url: String,
    isSecure: Boolean,
    isResponsive: Boolean,
    copyrightYear: Number,
    emails: [String],
    socialLinks: [{
      network: String,
      url: String
    }],
    opportunityScore: Number,
    status: String,
    isThirdParty: Boolean,
    aiData: {
      ownerName: String,
      mainPainPoint: String,
      featuredItem: String
    }
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true // Cria automaticamente campos createdAt e updatedAt
});

// Index para expiração automática (opcional: se quiser que o cache suma após X dias)
// leadSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 }); // 7 dias

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;