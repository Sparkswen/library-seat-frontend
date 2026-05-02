import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import SeatMap from '../views/SeatMap.vue'
import Leaderboard from '../views/Leaderboard.vue'
import Store from '../views/Store.vue'
import Statistics from '../views/Statistics.vue'
import Notifications from '../views/Notifications.vue'
import MyReservations from '../views/MyReservations.vue'
import Profile from '../views/Profile.vue'

// 管理后台
import AdminLayout from '../views/admin/AdminLayout.vue'
import Dashboard from '../views/admin/Dashboard.vue'
import Seats from '../views/admin/Seats.vue'
import Reservations from '../views/admin/Reservations.vue'
import Users from '../views/admin/Users.vue'
import Violations from '../views/admin/Violations.vue'
import Reports from '../views/admin/Reports.vue'
import Visualization from '../views/admin/Visualization.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 前台路由
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: Login },
    { path: '/seatmap', name: 'seatmap', component: SeatMap },
    { path: '/my-reservations', name: 'myReservations', component: MyReservations },
    { path: '/leaderboard', name: 'leaderboard', component: Leaderboard },
    { path: '/store', name: 'store', component: Store },
    { path: '/statistics', name: 'statistics', component: Statistics },
    { path: '/notifications', name: 'notifications', component: Notifications },
    { path: '/profile', name: 'profile', component: Profile },
    
    // 管理后台路由
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: Dashboard },
        { path: 'seats', name: 'seats', component: Seats },
        { path: 'reservations', name: 'reservations', component: Reservations },
        { path: 'users', name: 'users', component: Users },
        { path: 'violations', name: 'violations', component: Violations },
        { path: 'reports', name: 'reports', component: Reports },
        { path: 'visualization', name: 'visualization', component: Visualization }
      ]
    }
  ]
})

export default router