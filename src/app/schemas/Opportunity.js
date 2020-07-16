const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema(
  {
    opportunities: [
      {
        order_id: Number,
        person_name: String,
        title: String,
        value: Number,
        formatted_value: String,
        owner_name: String
      }
    ],
    date: Date,
    amount: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Opportunity', OpportunitySchema);
