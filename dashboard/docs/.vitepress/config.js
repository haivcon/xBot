import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "xLayer.my",
  description: "Tài liệu hệ sinh thái Web3 xLayer.my",
  base: '/docs/',
  outDir: '../dist/docs',
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Trang Chủ', link: '/' },
      { text: 'xBot', link: '/xbot' },
      { text: 'xKey', link: '/xkey' },
      { text: 'Về xLayer', link: 'https://xlayer.my' }
    ],

    sidebar: [
      {
        text: 'Giới Thiệu',
        items: [
          { text: 'Tổng Quan', link: '/' },
          { text: 'Bắt Đầu Nhanh', link: '/getting-started' }
        ]
      },
      {
        text: 'Hệ Sinh Thái',
        items: [
          { text: '🤖 xBot - AI Trading', link: '/xbot' },
          { text: '🔑 xKey - Offline Vault', link: '/xkey' }
        ]
      },
      {
        text: 'Dành Cho Lập Trình Viên',
        items: [
          { text: 'Developer & Open Source', link: '/developer' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/haivcon/xbot' },
      { icon: 'twitter', link: 'https://x.com/XlayerAi_bot' }
    ],

    footer: {
      message: 'Mã nguồn mở theo giấy phép MIT.',
      copyright: 'Copyright © 2026 D O R E M O N - xLayer.my'
    },
    
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Tìm kiếm',
                buttonAriaLabel: 'Tìm kiếm'
              },
              modal: {
                noResultsText: 'Không tìm thấy kết quả cho',
                resetButtonTitle: 'Xóa tìm kiếm',
                footer: {
                  selectText: 'chọn',
                  navigateText: 'chuyển',
                  closeText: 'đóng'
                }
              }
            }
          }
        }
      }
    }
  }
})
