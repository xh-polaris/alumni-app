import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Home from '@/pages/activity/index.vue';
import ActivityDetails from '@/pages/activity/details.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/activity/:id',
    name: 'ActivityDetails',
    component: ActivityDetails,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
