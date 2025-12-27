export default {
  routes: [
    { method: 'GET', path: '/formation-reflections', handler: 'formation-reflection.find' },
    { method: 'GET', path: '/formation-reflections/:id', handler: 'formation-reflection.findOne' },
    { method: 'POST', path: '/formation-reflections', handler: 'formation-reflection.create' },
  ],
};
