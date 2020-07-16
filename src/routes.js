const { Router } = require('express');

const OpportunityController = require('./app/controllers/OpportunityController');

const routes = new Router();

routes.get('/opportunities', OpportunityController.index);
routes.post('/opportunities', OpportunityController.store);

module.exports = routes;
