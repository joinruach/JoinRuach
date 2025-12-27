export default {
  routes: [
    { method: 'GET', path: '/formation-events', handler: 'formation-event.find' },
    { method: 'GET', path: '/formation-events/:id', handler: 'formation-event.findOne' },
    { method: 'POST', path: '/formation-events', handler: 'formation-event.create' },
  ],
};
