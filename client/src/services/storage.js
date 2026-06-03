/**
 * localStorage 存储服务
 * 保存用户输入和 AI 结果，防止刷新丢失
 */

const STORAGE_KEY = 'goodnight_feelings';

/**
 * 保存当前会话数据
 */
export function saveSession(data) {
  try {
    const session = {
      ...data,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('localStorage 保存失败:', e);
  }
}

/**
 * 读取当前会话数据
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('localStorage 读取失败:', e);
    return null;
  }
}

/**
 * 清空会话数据（一键重置 Demo）
 */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
