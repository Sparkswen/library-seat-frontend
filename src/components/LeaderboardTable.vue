<template>
  <el-table :data="data" v-loading="loading" stripe style="width: 100%">
    <el-table-column type="index" label="排名" width="80" align="center">
      <template #default="{ $index }">
        <div class="rank-cell">
          <el-tag v-if="$index === 0" type="danger" effect="dark">🥇</el-tag>
          <el-tag v-else-if="$index === 1" type="warning" effect="dark">🥈</el-tag>
          <el-tag v-else-if="$index === 2" type="success" effect="dark">🥉</el-tag>
          <span v-else>{{ $index + 1 }}</span>
        </div>
      </template>
    </el-table-column>
    
    <el-table-column label="用户" min-width="200">
      <template #default="{ row }">
        <div class="user-cell">
          <el-avatar :size="40" :src="getAvatar(row.level)" />
          <div class="user-info">
            <div class="name">{{ row.name }}</div>
            <div class="student-no">{{ row.studentNo }}</div>
          </div>
        </div>
      </template>
    </el-table-column>
    
    <el-table-column prop="level" label="等级" width="120" align="center">
      <template #default="{ row }">
        <el-tag :type="getLevelType(row.level)" effect="plain">
          {{ row.level }}
        </el-tag>
      </template>
    </el-table-column>
    
    <el-table-column prop="hours" label="学习时长" width="150" align="center">
      <template #default="{ row }">
        <span class="hours">{{ row.hours }} 小时</span>
      </template>
    </el-table-column>
    
    <el-table-column prop="points" label="积分" width="120" align="center">
      <template #default="{ row }">
        <span class="points">💎 {{ row.points }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const getAvatar = (level) => {
  const seeds = { '学童': 1, '学匠': 2, '学师': 3, '学宗': 4, '学圣': 5 }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seeds[level] || 1}`
}

const getLevelType = (level) => {
  const types = { '学童': '', '学匠': 'success', '学师': 'warning', '学宗': 'danger', '学圣': 'danger' }
  return types[level] || ''
}
</script>

<style scoped>
.rank-cell {
  font-size: 18px;
  font-weight: bold;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info .name {
  font-weight: bold;
  color: #303133;
}

.user-info .student-no {
  font-size: 12px;
  color: #909399;
}

.hours {
  color: #409eff;
  font-weight: bold;
}

.points {
  color: #e6a23c;
  font-weight: bold;
}
</style>
