<template>
  <div class="profile-container">
    <el-header class="header">
      <div class="header-left">
        <h2>👤 个人中心</h2>
      </div>
      <div class="header-right">
        <el-button @click="goBack">返回座位页</el-button>
      </div>
    </el-header>

    <div class="profile-content">
      <!-- 基本信息卡片 -->
      <el-row :gutter="20">
        <el-col :xs="24" :md="8">
          <el-card class="avatar-card">
            <div class="avatar-section">
              <el-avatar :size="100" :src="userAvatar" class="user-avatar" />
              <h3 class="user-name">{{ userInfo.name }}</h3>
              <p class="user-role">{{ getRoleLabel(userInfo.role) }}</p>
              <el-tag :type="levelType" effect="dark" size="large" class="level-tag">
                {{ userInfo.levelDisplayName || '学童' }}
              </el-tag>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="16">
          <el-card class="info-card">
            <template #header>
              <span>📋 基本信息</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="学号">{{ userInfo.studentNo }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ userInfo.name }}</el-descriptions-item>
              <el-descriptions-item label="角色">
                <el-tag :type="getRoleType(userInfo.role)">
                  {{ getRoleLabel(userInfo.role) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="等级">
                <el-tag :type="levelType" effect="plain">
                  {{ userInfo.levelDisplayName || '学童' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="信用分">
                <span :style="{ color: getCreditColor(userInfo.creditScore) }">
                  {{ userInfo.creditScore || 100 }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="当前积分">{{ userInfo.points || 0 }}</el-descriptions-item>
              <el-descriptions-item label="总学习时长">
                {{ formatStudyTime(userInfo.totalStudyMinutes) }}
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ userInfo.createTime || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据统计 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-icon" style="background: #409eff;">📚</div>
            <div class="stat-value">{{ statistics.totalReservations }}</div>
            <div class="stat-label">累计预约</div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-icon" style="background: #67c23a;">⏰</div>
            <div class="stat-value">{{ statistics.totalStudyHours }}</div>
            <div class="stat-label">学习时长(小时)</div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-icon" style="background: #e6a23c;">⭐</div>
            <div class="stat-value">{{ statistics.totalPoints }}</div>
            <div class="stat-label">累计积分</div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-icon" style="background: #f56c6c;">🏆</div>
            <div class="stat-value">{{ statistics.rank }}</div>
            <div class="stat-label">当前排名</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 功能菜单 -->
      <el-card class="menu-card">
        <template #header>
          <span>⚙️ 功能设置</span>
        </template>
        <div class="menu-list">
          <div class="menu-item" @click="showEditProfile">
            <div class="menu-icon">✏️</div>
            <div class="menu-info">
              <h4>编辑资料</h4>
              <p>修改个人信息</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="menu-item" @click="showChangePassword">
            <div class="menu-icon">🔐</div>
            <div class="menu-info">
              <h4>修改密码</h4>
              <p>定期更换密码保障安全</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="menu-item" @click="goToMyReservations">
            <div class="menu-icon">📋</div>
            <div class="menu-info">
              <h4>我的预约</h4>
              <p>查看预约记录</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="menu-item" @click="goToStatistics">
            <div class="menu-icon">📊</div>
            <div class="menu-info">
              <h4>学习统计</h4>
              <p>查看学习数据分析</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="menu-item" @click="showAbout">
            <div class="menu-icon">ℹ️</div>
            <div class="menu-info">
              <h4>关于系统</h4>
              <p>系统版本与说明</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="menu-item logout-item" @click="handleLogout">
            <div class="menu-icon">🚪</div>
            <div class="menu-info">
              <h4>退出登录</h4>
              <p>安全退出当前账号</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="100px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitChangePassword" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑资料" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 关于系统对话框 -->
    <el-dialog v-model="aboutDialogVisible" title="关于系统" width="500px">
      <div class="about-content">
        <h2>📚 图书馆座位预约系统</h2>
        <p class="version">版本: v1.0.0</p>
        <div class="divider" />
        <p class="description">
          本系统基于 SpringBoot + Vue 开发，旨在解决图书馆占座问题，
          提高座位利用率，通过游戏化激励机制激发学生学习热情。
        </p>
        <div class="features">
          <h4>核心功能</h4>
          <ul>
            <li>✅ 在线座位预约与时段管理</li>
            <li>✅ 多模态签到检测（WiFi/蓝牙/RFID/摄像头预留）</li>
            <li>✅ 游戏化学习激励体系</li>
            <li>✅ 积分商城与排行榜</li>
            <li>✅ 数据可视化统计</li>
            <li>✅ 管理后台</li>
          </ul>
        </div>
        <div class="divider" />
        <p class="copyright">© 2026 吉林农业大学 计算机科学与技术</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const userInfo = ref({})
const submitting = ref(false)

// 统计数据
const statistics = ref({
  totalReservations: 12,
  totalStudyHours: 48,
  totalPoints: 360,
  rank: 15
})

// 头像
const userAvatar = computed(() => {
  const seed = userInfo.value.studentNo || 'default'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
})

// 等级颜色
const levelType = computed(() => {
  const level = userInfo.value.levelTitle
  const types = {
    'XUETONG': '',
    'XUEJIANG': 'success',
    'XUESHI': 'warning',
    'XUEZONG': 'danger',
    'XUESHENG': 'danger'
  }
  return types[level] || ''
})

// 对话框显示状态
const passwordDialogVisible = ref(false)
const editDialogVisible = ref(false)
const aboutDialogVisible = ref(false)

// 密码表单
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 编辑表单
const editForm = ref({
  name: '',
  phone: ''
})

const loadUserInfo = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  userInfo.value = user
}

const getRoleType = (role) => {
  const types = { STUDENT: '', LIBRARIAN: 'warning', ADMIN: 'danger' }
  return types[role] || ''
}

const getRoleLabel = (role) => {
  const labels = { STUDENT: '学生', LIBRARIAN: '馆员', ADMIN: '管理员' }
  return labels[role] || '学生'
}

const getCreditColor = (score) => {
  if (!score || score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const formatStudyTime = (minutes) => {
  if (!minutes) return '0小时'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
}

// 显示修改密码
const showChangePassword = () => {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  passwordDialogVisible.value = true
}

// 提交修改密码
const submitChangePassword = async () => {
  passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      // TODO: 调用后端API
      await new Promise(resolve => setTimeout(resolve, 500))
      ElMessage.success('密码修改成功，请重新登录')
      passwordDialogVisible.value = false
      setTimeout(() => {
        localStorage.removeItem('user')
        router.push('/login')
      }, 1500)
    } catch (error) {
      ElMessage.error('修改失败')
    } finally {
      submitting.value = false
    }
  })
}

// 显示编辑资料
const showEditProfile = () => {
  editForm.value = {
    name: userInfo.value.name || '',
    phone: userInfo.value.phone || ''
  }
  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  submitting.value = true
  try {
    userInfo.value.name = editForm.value.name
    localStorage.setItem('user', JSON.stringify(userInfo.value))
    ElMessage.success('保存成功')
    editDialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

// 显示关于
const showAbout = () => {
  aboutDialogVisible.value = true
}

// 导航
const goBack = () => {
  router.push('/seatmap')
}

const goToMyReservations = () => {
  router.push('/my-reservations')
}

const goToStatistics = () => {
  router.push('/statistics')
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('user')
    ElMessage.success('已退出登录')
    router.push('/login')
  })
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 0 20px;
}

.profile-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 头像卡片 */
.avatar-card {
  margin-bottom: 20px;
}

.avatar-section {
  text-align: center;
  padding: 20px;
}

.user-avatar {
  margin-bottom: 15px;
}

.user-name {
  margin: 10px 0;
  color: #303133;
}

.user-role {
  color: #909399;
  margin-bottom: 10px;
}

.level-tag {
  margin-top: 10px;
}

/* 信息卡片 */
.info-card {
  margin-bottom: 20px;
}

/* 统计 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  color: #909399;
  font-size: 13px;
  margin-top: 5px;
}

/* 菜单 */
.menu-card {
  margin-bottom: 20px;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #ecf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 15px;
}

.menu-info {
  flex: 1;
}

.menu-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.menu-info p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.logout-item .menu-icon {
  background-color: #fef0f0;
}

.logout-item:hover {
  background-color: #fef0f0;
}

.logout-item h4 {
  color: #f56c6c;
}

/* 关于系统 */
.about-content {
  text-align: center;
  padding: 20px;
}

.about-content h2 {
  color: #303133;
  margin-bottom: 10px;
}

.version {
  color: #909399;
  font-size: 14px;
}

.divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 20px 0;
}

.description {
  color: #606266;
  line-height: 1.8;
  text-align: left;
}

.features {
  text-align: left;
  margin: 20px 0;
}

.features h4 {
  color: #303133;
  margin-bottom: 10px;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  padding: 5px 0;
  color: #606266;
}

.copyright {
  color: #909399;
  font-size: 12px;
}
</style>