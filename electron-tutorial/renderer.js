// Electron 渲染进程 - 处理用户界面交互

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Electron 渲染进程已启动');

  // 初始化应用
  await initializeApp();
  setupEventListeners();
});

// 初始化应用
async function initializeApp() {
  try {
    // 获取并显示应用版本
    const version = await window.electronAPI.getAppVersion();
    document.getElementById('app-version').textContent = version;

    // 获取并显示平台信息
    const systemInfo = await window.electronAPI.getSystemInfo();
    document.getElementById('platform-info').textContent =
      `${systemInfo.platform} (${systemInfo.arch})`;

    console.log('应用初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 获取版本信息按钮
  document.getElementById('btn-version').addEventListener('click', async () => {
    try {
      const version = await window.electronAPI.getAppVersion();
      displayInfo(`应用版本: ${version}`);
    } catch (error) {
      displayError('获取版本信息失败: ' + error.message);
    }
  });

  // 获取系统信息按钮
  document.getElementById('btn-system').addEventListener('click', async () => {
    try {
      const info = await window.electronAPI.getSystemInfo();
      const infoText = `
        <strong>系统信息:</strong><br>
        平台: ${info.platform}<br>
        架构: ${info.arch}<br>
        Node 版本: ${info.version}<br>
        Electron 版本: ${info.electronVersion}<br>
        Chrome 版本: ${info.chromeVersion}
      `;
      displayInfo(infoText);
    } catch (error) {
      displayError('获取系统信息失败: ' + error.message);
    }
  });

  // 保存数据按钮
  document.getElementById('btn-save').addEventListener('click', async () => {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        message: '这是一条测试数据',
        user: 'Electron 用户'
      };

      const result = await window.electronAPI.saveData(data);
      if (result.success) {
        displaySuccess(`✓ ${result.message}`);
      }
    } catch (error) {
      displayError('保存数据失败: ' + error.message);
    }
  });

  // 加载数据按钮
  document.getElementById('btn-load').addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.loadData();
      if (result.success) {
        displayInfo(`加载的数据: ${result.data}`);
      }
    } catch (error) {
      displayError('加载数据失败: ' + error.message);
    }
  });

  // 发送消息按钮
  document.getElementById('btn-send').addEventListener('click', () => {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (message) {
      displayMessage(`您发送的消息: ${message}`);
      input.value = '';
    } else {
      displayMessage('请输入消息内容');
    }
  });

  // 打开开发者工具按钮
  const devToolsBtn = document.getElementById('btn-devtools');
  if (devToolsBtn) {
    devToolsBtn.addEventListener('click', () => {
      // 这个功能需要在 preload.js 中暴露相应的 API
      displayInfo('开发者工具切换 (使用菜单: 视图 -> 开发者工具)');
    });
  }

  // 外部链接处理
  document.querySelectorAll('.external-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const url = e.target.getAttribute('data-url');
      displayInfo(`外部链接: ${url}<br><small>在实际应用中，这会使用 shell.openExternal() 打开浏览器</small>`);
    });
  });

  // 监听来自主进程的消息
  window.electronAPI.onMenuNew(() => {
    displayInfo('菜单: 新建操作被触发');
  });

  window.electronAPI.onMenuOpen(() => {
    displayInfo('菜单: 打开操作被触发');
  });

  window.electronAPI.onShowAbout(() => {
    displayInfo(`
      <strong>关于 Electron 教程应用</strong><br>
      版本: 1.0.0<br>
      这是一个学习 Electron 的示例应用<br>
      集成 Supabase 后端服务
    `);
  });
}

// 辅助函数：显示信息
function displayInfo(message) {
  const display = document.getElementById('info-display');
  display.innerHTML = `<div class="info">${message}</div>`;
  display.className = 'info-box info';
}

// 辅助函数：显示成功消息
function displaySuccess(message) {
  const display = document.getElementById('info-display');
  display.innerHTML = `<div class="success">${message}</div>`;
  display.className = 'info-box success';
}

// 辅助函数：显示错误
function displayError(message) {
  const display = document.getElementById('info-display');
  display.innerHTML = `<div class="error">❌ ${message}</div>`;
  display.className = 'info-box error';
}

// 辅助函数：显示消息
function displayMessage(message) {
  const display = document.getElementById('message-display');
  const timestamp = new Date().toLocaleTimeString('zh-CN');
  const messageHtml = `
    <div class="message-item">
      <span class="timestamp">[${timestamp}]</span>
      <span class="message-text">${message}</span>
    </div>
  `;
  display.innerHTML = messageHtml + display.innerHTML;
}

// Supabase 集成示例（需要先安装 @supabase/supabase-js）
/*
const { createClient } = require('@supabase/supabase-js');

// Supabase 配置（请替换为您的实际配置）
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// 示例：从 Supabase 获取数据
async function fetchDataFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('your_table')
      .select('*');

    if (error) throw error;

    displayInfo(`从 Supabase 获取到 ${data.length} 条数据`);
    return data;
  } catch (error) {
    displayError('Supabase 查询失败: ' + error.message);
  }
}

// 示例：向 Supabase 插入数据
async function insertDataToSupabase(newData) {
  try {
    const { data, error } = await supabase
      .from('your_table')
      .insert([newData]);

    if (error) throw error;

    displaySuccess('数据已成功保存到 Supabase');
    return data;
  } catch (error) {
    displayError('Supabase 插入失败: ' + error.message);
  }
}
*/
