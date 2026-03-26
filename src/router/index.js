import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import SeatMap from '../views/SeatMap.vue'
import Leaderboard from '../views/Leaderboard.vue'
import Store from '../views/Store.vue'
import Statistics from '../views/Statistics.vue'
import Notifications from '../views/Notifications.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import Dashboard from '../views/admin/Dashboard.vue'
import Seats from '../views/admin/Seats.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/seatmap',
      name: 'seatmap',
      component: SeatMap
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: Leaderboard
    },
    {
      path: '/store',
      name: 'store',
      component: Store
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: Statistics
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: Notifications
    },
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: 'seats',
          name: 'seats',
          component: Seats
        },
        {
          path: 'reservations',
          name: 'reservations',
          component: () => import('../views/admin/Reservations.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/admin/Users.vue')
        },
        {
          path: 'violations',
          name: 'violations',
          component: () => import('../views/admin/Violations.vue')
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('../views/admin/Reports.vue')
        }
      ]
    }
  ]
})

export default router
