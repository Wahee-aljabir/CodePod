const Joi = require('joi');

// Project schema for validation
const projectSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow(''),
  html: Joi.string().max(50000).allow(''),
  css: Joi.string().max(50000).allow(''),
  javascript: Joi.string().max(50000).allow(''),
  isPublic: Joi.boolean().default(true),
  tags: Joi.array().items(Joi.string().max(20)).max(10).default([]),
  forkFrom: Joi.string().allow(null),
  userId: Joi.string().required()
});

// Update schema (all fields optional except userId)
const updateProjectSchema = Joi.object({
  title: Joi.string().min(1).max(100),
  description: Joi.string().max(500).allow(''),
  html: Joi.string().max(50000).allow(''),
  css: Joi.string().max(50000).allow(''),
  javascript: Joi.string().max(50000).allow(''),
  isPublic: Joi.boolean(),
  tags: Joi.array().items(Joi.string().max(20)).max(10),
  userId: Joi.string().required()
});

// Project class for data manipulation
class Project {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title || 'Untitled';
    this.description = data.description || '';
    this.html = data.html || '';
    this.css = data.css || '';
    this.javascript = data.javascript || '';
    this.isPublic = data.isPublic !== undefined ? data.isPublic : true;
    this.tags = data.tags || [];
    this.userId = data.userId;
    this.forkFrom = data.forkFrom || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.views = data.views || 0;
    this.likes = data.likes || 0;
    this.forks = data.forks || 0;
  }

  // Convert to Firestore document
  toFirestore() {
    const { id, ...data } = this;
    return {
      ...data,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new Project({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    });
  }

  // Validate project data
  static validate(data, isUpdate = false) {
    const schema = isUpdate ? updateProjectSchema : projectSchema;
    return schema.validate(data);
  }

  // Get public fields only
  toPublic() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      html: this.html,
      css: this.css,
      javascript: this.javascript,
      isPublic: this.isPublic,
      tags: this.tags,
      userId: this.userId,
      forkFrom: this.forkFrom,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      views: this.views,
      likes: this.likes,
      forks: this.forks
    };
  }
}

module.exports = {
  Project,
  projectSchema,
  updateProjectSchema
};