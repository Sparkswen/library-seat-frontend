<template>
  <div class="store-container">
    <el-header class="header">
      <div class="header-left">
        <h2>🛒 积分商城</h2>
      </div>
      <div class="header-right">
        <el-tag type="warning" effect="dark" size="large">
          💎 我的积分: {{ userInfo.points || 0 }}
        </el-tag>
        <el-button @click="goBack">返回座位页</el-button>
      </div>
    </el-header>

    <div class="store-content">
      <!-- 商品分类 -->
      <div class="category-tabs">
        <el-radio-group v-model="currentCategory" size="large">
          <el-radio-button label="all">全部商品</el-radio-button>
          <el-radio-button label="food">🍔 美食券</el-radio-button>
          <el-radio-button label="gift">🎁 文创周边</el-radio-button>
          <el-radio-button label="service">📚 服务权益</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 商品列表 -->
      <el-row :gutter="20" class="goods-list" v-loading="loading">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in filteredGoods" :key="item.id">
          <el-card class="goods-card" :body-style="{ padding: '0px' }" shadow="hover">
            <div class="goods-image">
              <img :src="item.image" :alt="item.name" />
              <div class="goods-tag" v-if="item.hot">🔥 热销</div>
            </div>
            <div class="goods-info">
              <h3 class="goods-name">{{ item.name }}</h3>
              <p class="goods-desc">{{ item.description }}</p>
              <div class="goods-footer">
                <div class="goods-price">
                  <span class="price-num">{{ item.price }}</span>
                  <span class="price-unit">积分</span>
                </div>
                <el-button 
                  type="primary" 
                  :disabled="userInfo.points < item.price || item.stock === 0"
                  @click="handleExchange(item)"
                >
                  {{ item.stock === 0 ? '已兑完' : '立即兑换' }}
                </el-button>
              </div>
              <div class="goods-stock">剩余: {{ item.stock }} 件</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 兑换记录 -->
      <el-card class="exchange-record">
        <template #header>
          <div class="record-header">
            <span>📋 我的兑换记录</span>
            <el-button link type="primary" @click="loadRecords">刷新</el-button>
          </div>
        </template>
        <el-table :data="exchangeRecords" stripe>
          <el-table-column prop="goodsName" label="商品名称" />
          <el-table-column prop="price" label="消耗积分" width="120">
            <template #default="{ row }">
              <span style="color: #f56c6c">-{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="exchangeTime" label="兑换时间" width="180" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === '已领取' ? 'success' : 'warning'">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button 
                v-if="row.status === '待领取'" 
                type="success" 
                size="small"
                @click="handleReceive(row)"
              >
                领取
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 兑换确认对话框 -->
    <el-dialog v-model="exchangeDialogVisible" title="确认兑换" width="400px">
      <div class="exchange-confirm">
        <img :src="selectedGoods?.image" class="confirm-img" />
        <h3>{{ selectedGoods?.name }}</h3>
        <p>需要消耗 <span class="highlight">{{ selectedGoods?.price }}</span> 积分</p>
        <p>兑换后剩余积分: <span class="highlight">{{ (userInfo.points || 0) - (selectedGoods?.price || 0) }}</span></p>
      </div>
      <template #footer>
        <el-button @click="exchangeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExchange" :loading="exchanging">
          确认兑换
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const currentCategory = ref('all')
const exchangeDialogVisible = ref(false)
const exchanging = ref(false)
const selectedGoods = ref(null)
const userInfo = ref({})

// 商品数据
const goodsList = ref([
  {
    id: 1,
    name: '食堂10元餐券',
    description: '可在学校任意食堂使用，抵扣10元',
    price: 100,
    stock: 50,
    category: 'food',
    hot: true,
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=FOOD&backgroundColor=ffdfbf'
  },
  {
    id: 2,
    name: '食堂20元餐券',
    description: '可在学校任意食堂使用，抵扣20元',
    price: 180,
    stock: 30,
    category: 'food',
    hot: false,
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=FOOD20&backgroundColor=ffdfbf'
  },
  {
    id: 3,
    name: '图书馆文创马克杯',
    description: '图书馆限定版马克杯，精美设计',
    price: 300,
    stock: 20,
    category: 'gift',
    hot: true,
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=CUP&backgroundColor=c0aede'
  },
  {
    id: 4,
    name: '图书馆纪念徽章',
    description: '金属徽章，收藏价值高',
    price: 150,
    stock: 100,
    category: 'gift',
    hot: false,
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=BADGE&backgroundColor=c0aede'
  },
  {
    id: 5,
    name: '图书馆定制笔记本',
    description: 'A5大小，100页，优质纸张',
    price: 200,
    stock: 40,
    category: 'gift',
    hot: false,
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=BOOK&backgroundColor=c0aede'
  },
  {
    id: 6,
    name: '延长预约时长1小时',
    description: '单次预约可延长1小时使用时间',
    price: 50,
    stock: 999,
    category: 'service',
    hot: false,
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=TIME&backgroundColor=b6e3f4'
  },
  {
    id: 7,
    name: '预约优先权1次',
    description: '高峰期优先获得座位预约权',
    price: 80,
    stock: 50,
    category: 'service',
    hot: true,
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=VIP&backgroundColor=b6e3f4'
  },
  {
    id: 8,
    name: '第二课堂学分0.5分',
    description: '可兑换第二课堂学分',
    price: 500,
    stock: 10,
    category: 'service',
    hot: false,
    image: 'https://api.dicebear.com/7.x/initials/svg?seed=SCORE&backgroundColor=b6e3f4'
  }
])

// 兑换记录
const exchangeRecords = ref([])

const filteredGoods = computed(() => {
  if (currentCategory.value === 'all') {
    return goodsList.value
  }
  return goodsList.value.filter(item => item.category === currentCategory.value)
})

const loadUserInfo = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  userInfo.value = user
}

const loadRecords = () => {
  // 模拟加载兑换记录
  exchangeRecords.value = [
    {
      id: 1,
      goodsName: '食堂10元餐券',
      price: 100,
      exchangeTime: '2026-03-20 14:30:00',
      status: '已领取'
    },
    {
      id: 2,
      goodsName: '图书馆文创马克杯',
      price: 300,
      exchangeTime: '2026-03-25 10:15:00',
      status: '待领取'
    }
  ]
}

const handleExchange = (item) => {
  if (userInfo.value.points < item.price) {
    ElMessage.warning('积分不足')
    return
  }
  selectedGoods.value = item
  exchangeDialogVisible.value = true
}

const confirmExchange = async () => {
  exchanging.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 扣除积分
    userInfo.value.points -= selectedGoods.value.price
    localStorage.setItem('user', JSON.stringify(userInfo.value))
    
    // 减少库存
    const goods = goodsList.value.find(g => g.id === selectedGoods.value.id)
    if (goods) goods.stock--
    
    // 添加记录
    exchangeRecords.value.unshift({
      id: Date.now(),
      goodsName: selectedGoods.value.name,
      price: selectedGoods.value.price,
      exchangeTime: new Date().toLocaleString(),
      status: '待领取'
    })
    
    ElMessage.success('兑换成功！')
    exchangeDialogVisible.value = false
  } catch (error) {
    ElMessage.error('兑换失败')
  } finally {
    exchanging.value = false
  }
}

const handleReceive = (row) => {
  ElMessageBox.confirm('确认领取该商品？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    row.status = '已领取'
    ElMessage.success('领取成功！')
  })
}

const goBack = () => {
  router.push('/seatmap')
}

onMounted(() => {
  loadUserInfo()
  loadRecords()
})
</script>

<style scoped>
.store-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.store-content {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.category-tabs {
  text-align: center;
  margin-bottom: 20px;
}

.goods-list {
  margin-bottom: 30px;
}

.goods-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.goods-card:hover {
  transform: translateY(-5px);
}

.goods-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.goods-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goods-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.goods-info {
  padding: 15px;
}

.goods-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goods-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 15px;
  height: 36px;
  overflow: hidden;
}

.goods-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-price {
  display: flex;
  align-items: baseline;
}

.price-num {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.price-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 5px;
}

.goods-stock {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.exchange-record {
  margin-top: 20px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exchange-confirm {
  text-align: center;
}

.confirm-img {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.highlight {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}
</style>
