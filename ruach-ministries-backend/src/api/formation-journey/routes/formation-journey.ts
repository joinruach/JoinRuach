export default {
  routes: [
    { method: 'GET', path: '/formation-journeys', handler: 'formation-journey.find' },
    { method: 'GET', path: '/formation-journeys/:id', handler: 'formation-journey.findOne' },
    { method: 'POST', path: '/formation-journeys', handler: 'formation-journey.create' },
    { method: 'PUT', path: '/formation-journeys/:id', handler: 'formation-journey.update' },
  ],
};
