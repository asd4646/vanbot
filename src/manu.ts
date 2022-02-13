var login_with_passwd=[
    {
        type: 'password',
        message: '请输入密码（密码不可见）',
        mask: '*',
        name: 'passwd'
    }, {
        type: 'password',
        message: '确认密码',
        mask: '*',
        name: 'passwd_'
    }, {
        type: 'list',
        message: '接下来',
        choices: [
            '登录',
            '取消'
        ],
        name: 'next',
        default: '登录'
    }
]
var App_start=[
    {
        type: 'list',
        message: '请选择菜单',
        default: '登录',
        name: 'start',
        choices: [
            '登录',
            '退出'
        ],
    }
]
var login=[
    {
        type: 'list',
        message: '由于验证码问题第一次推荐使用扫码，登录成功后再使用密码登录更稳定',
        name: 'login_way',
        default: '扫码',
        choices: [
            '扫码',
            '密码',
            '返回主菜单'
        ]
    }
]
var panel=[
    {
        type: 'list',
        message: '使用↑↓选择命令',
        name: 'panel',
        choices: [
            '基本功能设置',
            '手动发送消息',
            '机器人下线',
            '退出'
        ],
        default: '基本功能设置'
    }
]
var panel_send_msg=[
    {
        type: 'list',
        message: '选择发送对象',
        name: 'target',
        choices: [
            '群',
            '好友',
            '取消'
        ],
        default: '取消'
    }
]
var add_key=[
    {
        type: 'input',
        message: '输入关键词',
        name: 'key',
        default: 'key'
    }, {
        type: 'input',
        message: '输入对应的回复',
        name: 're',
        default: 're'
    }
]

var manus = {add_key,App_start,login,panel,panel_send_msg,login_with_passwd}
export = manus;