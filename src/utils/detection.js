import request from './request'

/**
 * 多模态检测接口
 * 预留 WiFi、蓝牙、RFID、摄像头检测功能
 */

// 手动触发检测
export const checkPresence = (studentNo, seatNo, mode = 'MULTI') => {
  return request.post('/detection/check', null, {
    params: { studentNo, seatNo, mode }
  })
}

// 获取检测系统状态
export const getDetectionStatus = () => {
  return request.get('/detection/status')
}

// WiFi 检测
export const checkWifi = (studentNo, seatNo) => {
  return checkPresence(studentNo, seatNo, 'WIFI')
}

// 蓝牙检测
export const checkBluetooth = (studentNo, seatNo) => {
  return checkPresence(studentNo, seatNo, 'BLUETOOTH')
}

// RFID 检测
export const checkRfid = (studentNo, seatNo, rfidToken) => {
  return request.post('/detection/rfid', { studentNo, seatNo, rfidToken })
}

// 摄像头检测
export const checkCamera = (studentNo, seatNo) => {
  return checkPresence(studentNo, seatNo, 'CAMERA')
}
