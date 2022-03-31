import { Client, createClient, GroupInfo, segment } from "oicq";
import ora from 'ora';
import inquirer from "inquirer";
import path from 'path';
import manus from "./manu";
import Config from "./config";
var config = new Config;
var app!: Client;
//启动界面
function App_start() {
    console.clear();
    the_logo();
    console.log(the_title('\x1B[32m欢迎使用Vanbot,本机器人由梵高先生驱动\n\t邮箱：845541909@qq.com'));
    inquirer.prompt(manus.App_start).then(data => {
        switch (data.start) {
            case '登录':
                is_online_befor_login();
                break;
            case '退出':
                process.exit();
        }
    });
}
//登录前检查
function is_online_befor_login() {
    console.clear();
    console.log(the_title('登录准备'));
    inquirer.prompt([
        {
            type: 'number',
            message: '请输入QQ号',
            name: 'QQ'
        }, {
            type: 'number',
            message: '确认QQ号',
            name: 'QQ_'
        }
    ]).then(data => {
        if (!isNaN(data.QQ) && data.QQ == data.QQ_) {
            let QQ = data.QQ;
            app = createClient(QQ, { platform: 4, log_level: 'mark', data_dir: path.join(process.cwd(), 'data') });
            if (app.isOnline()) {
                console.log('已经登录，跳转至控制台');
                panel();
            } else {
                login(QQ);
            }
        } else {
            console.log('请重新输入');
            is_online_befor_login();
        }
    })
}
//登录选项
function login(QQ: any) {
    console.clear();
    console.log(the_title('选择登录方式(选择扫码前请最大化窗口)'));
    inquirer.prompt(manus.login).then(data => {
        switch (data.login_way) {
            case '扫码':
                login_with_scan(QQ);
                break;
            case '密码':
                login_with_passwd(QQ);
                break;
            case '返回主菜单':
                App_start();
                break;
        }
    })
}
//使用密码登录
function login_with_passwd(QQ: any) {
    console.clear();
    console.log(the_title('密码登录'));
    inquirer.prompt(manus.login_with_passwd).then(async data => {
        switch (data.next) {
            case '登录':
                if (data.passwd === data.passwd_) {
                    app.on('system.login.qrcode', function (e) {
                        process.stdin.once('data', () => {
                            this.login(data.passwd);
                        });
                    }).login(data.passwd);
                    app.on('system.login.error', error => {
                        console.log(error.message);
                        login_with_passwd(QQ);
                    })
                    app.on('system.online', () => {
                        panel();
                        QQ_is_online();
                    })
                } else {
                    console.log('两次密码不同');
                    login_with_passwd(QQ);
                }
                break;
            case '取消':
                App_start();
                break;
        }
    })
}
//扫码登录
async function login_with_scan(QQ: any) {
    console.clear();
    await app.once('system.login.qrcode', function (e) {
        process.stdin.once('data', () => {
            this.login();
        });
    }).login();
    inquirer.prompt([
        {
            type: 'list',
            message: '扫码（如果没有出现二维码请选择完成）',
            choices: [
                new inquirer.Separator,
                '完成',
                '重扫',
                new inquirer.Separator,
                '取消'
            ],
            name: 'name'
        }
    ]).then(data => {
        switch (data.name) {
            case '完成':
                let wait_login = ora('等待登录').start()
                app.on('system.online', () => {
                    clearTimeout(timeout);
                    wait_login.succeed().clear();
                    panel();
                    QQ_is_online();
                })
                let timeout = setTimeout(() => {
                    if (app.isOnline()) {
                        wait_login.succeed().clear();
                        panel();
                        QQ_is_online();
                    } else login_with_scan(QQ);
                }, 6000);
                break;
            case '重扫':
                login_with_scan(QQ);
                break;
            case '取消':
                App_start();
                break;
        }
    })
}
//控制面板
function panel() {
    console.clear();
    console.log(the_title('控制面板'))
    inquirer.prompt(manus.panel).then(async data => {
        switch (data.panel) {
            case '基本功能设置':
                base_function();
                break;
            case '手动发送消息':
                panel_send_msg();
                break;
            case '机器人下线':
                if (app.isOnline()) {
                    await app.logout();
                    App_start();
                } else {
                    console.log('已下线')
                }
                break;
            case '退出':
                let exit = ora('即将退出，正在保存设置······').start();
                config.save();
                setTimeout(() => {
                    exit.succeed();
                    process.exit();
                }, 3000);
        }
    })
}
//基本功能设置入口
function base_function() {
    console.clear();
    console.log(the_title('基本功能页面'))
    inquirer.prompt([
        {
            type: 'list',
            message: '选择功能(功能配置修改后立刻生效)',
            name: 'function',
            choices: [
                new inquirer.Separator,
                '定时发送',
                '入群欢迎',
                '关键词回复',
                new inquirer.Separator(),
                '返回'
            ],
            default: '返回'
        }
    ]).then(data => {
        switch (data.function) {
            case '返回':
                panel();
                break;
            case '定时发送':
                per_time()
                break;
            case '入群欢迎':
                welcome();
                break;
            case '关键词回复':
                key_and_reply();
                break;
        }
    })
}
//监听的群
function group_listener() {
    console.clear();
    let get_group_list = app.getGroupList();
    let obj: { [remark: string]: number } = {};
    let name_list_already: string[] = [];
    for (let i = 0; i < config.per_groups.length; i++) {
        let num = config.per_groups[i];
        let name = get_group_list.get(num)
        try {
            let push = name!.group_name;
            name_list_already.push(push);
        } catch (error) {
            console.log(error);
        }
    }
    for (let [k, v] of get_group_list) {
        obj[v.group_name] = v.group_id;
    }
    let name_list = Object.keys(obj);
    console.clear()
    console.log('>>>当前发送定时消息的群：\n    > ' + name_list_already);
    inquirer.prompt([
        {
            type: 'list',
            name: 'a',
            message: '选择接下来的操作',
            choices: [
                new inquirer.Separator,
                '增加',
                '删除',
                new inquirer.Separator,
                '返回'
            ]
        }
    ]).then(data => {
        switch (data.a) {
            case '返回':
                per_time();
                break;
            case '增加':
                group_add(obj, name_list);
                break;
            case '删除':
                group_delete(obj, name_list_already);
                break
        }
    })
}
//增加监听的群
function group_add(group_list: { [remark: string]: number }, name_list: string[]) {
    console.clear();
    inquirer.prompt([
        {
            type: 'list',
            message: '选择要增添的群',
            pageSize: 20,
            choices: name_list,
            name: 'add'
        }
    ]).then(data => {
        let id = group_list[data.add];
        config.per_groups.push(id);
        config.save();
        group_listener();
    })
}
//删除监听的群
function group_delete(group_list: { [remark: string]: number }, name_list_already: string[]) {
    console.clear();
    inquirer.prompt([
        {
            type: 'list',
            message: '选择要取消的群',
            pageSize: 20,
            choices: name_list_already,
            name: 'dele'
        }
    ]).then(data => {
        let id = group_list[data.dele];
        for (let i = 0; i < config.per_groups.length; i++) {
            if (id == config.per_groups[i]) {
                config.per_groups.splice(i, 1);
            }
        }
        config.save();
        group_listener();
    })
}
//关键词与回复
function key_and_reply() {
    console.clear();
    let key_list = '>>>当前关键词：\n';
    let keys: string[] = [];
    for (let i = 0; i < config.keywords_reply.length; i++) {
        let key = config.keywords_reply[i].key;
        let reply = config.keywords_reply[i].reply;
        key_list += '-----------> ' + key + ':' + reply + '\n';
        keys.push(key);
    }
    console.clear();
    console.log(key_list);
    inquirer.prompt([
        {
            type: 'list',
            message: '选择接下来的操作',
            name: 'key',
            choices: [
                new inquirer.Separator,
                '增加',
                '删除',
                new inquirer.Separator,
                '返回'
            ]
        }
    ]).then(data => {
        switch (data.key) {
            case '返回':
                base_function();
                break;
            case '增加':
                add_key();
                break;
            case '删除':
                delete_key(keys);
                break;
        }
    })
}
//增加关键词
function add_key() {
    console.clear();
    inquirer.prompt(manus.add_key).then(data => {
        let key = data.key;
        let re = data.re;
        let push = { "key": key, "reply": re };
        config.keywords_reply.push(push);
        config.save();
        key_and_reply();
    })
}
//删除关键词
function delete_key(keys: string[]) {
    console.clear();
    inquirer.prompt([
        {
            type: 'list',
            message: '选择要删除的关键词',
            pageSize: 20,
            choices: keys,
            name: 'key',
        }
    ]).then(data => {
        for (let i = 0; i < config.keywords_reply.length; i++) {
            if (data.key == config.keywords_reply[i].key) {
                config.keywords_reply.splice(i, 1);
            }
        }
        config.save();
        key_and_reply();
    })
}
//入群欢迎设置
function welcome() {
    console.clear();
    let status = config.welcome.enable == true ? '\x1B[32m √' : '\x1B[31m ×';
    console.log('>>>启用状态' + status);
    inquirer.prompt([
        {
            type: 'list',
            message: '选择接下来的操作',
            name: 'name',
            choices: [
                new inquirer.Separator,
                '启用',
                '禁用',
                '设置入群欢迎',
                new inquirer.Separator,
                '返回'
            ]
        }
    ]).then(data => {
        switch (data.name) {
            case '返回':
                base_function()
                break;
            case '启用':
                config.welcome.enable = true;
                config.save();
                welcome();
                break;
            case '禁用':
                config.welcome.enable = false;
                config.save();
                welcome();
                break;
            case '设置入群欢迎':
                set_welcome();
                break;
        }
    })
}
//设置入群欢迎
function set_welcome() {
    console.clear();
    console.log('>>>当前入群欢迎内容：' + config.welcome.info);
    inquirer.prompt([
        {
            type: 'list',
            message: '选择接下来的操作',
            name: 'name',
            choices: [
                new inquirer.Separator,
                '修改',
                new inquirer.Separator,
                '返回'
            ]
        }
    ]).then(data => {
        switch (data.name) {
            case '返回':
                welcome();
                break;
            case '修改':
                set_welcome_info();
                break
        }
    })
}
//修改入群欢迎
function set_welcome_info() {
    console.clear();
    inquirer.prompt([
        {
            type: 'input',
            message: '输入修改后的内容',
            name: 'name',
            default: config.welcome.info
        }
    ]).then(data => {
        config.welcome.info = data.name;
        config.save();
        set_welcome();
    })
}
//定时发送设置
function per_time() {
    console.clear();
    let status = config.per_time_info.enable == true ? '\x1B[32m √' : '\x1B[31m ×'
    console.log('>>>启用状态' + status);
    inquirer.prompt([
        {
            type: 'list',
            message: '选择接下来的操作',
            name: 'name',
            pageSize: 10,
            choices: [
                new inquirer.Separator,
                '启用',
                '禁用',
                '设置发送消息时间间隔',
                '设置发送消息内容',
                '目标群',
                new inquirer.Separator,
                '返回'
            ]
        }
    ]).then(data => {
        switch (data.name) {
            case '返回':
                base_function()
                break;
            case '启用':
                config.per_time_info.enable = true;
                config.save();
                per_time();
                break;
            case '禁用':
                config.per_time_info.enable = false;
                config.save();
                per_time();
                break;
            case '设置发送消息时间间隔':
                set_per_time();
                break;
            case '设置发送消息内容':
                set_per_info();
                break
            case '目标群':
                group_listener();
                break;
        }
    })
}
//设置定时消息内容
function set_per_info() {
    console.clear();
    console.log('>>>当前定时消息内容：' + config.per_time_info.info);
    inquirer.prompt([
        {
            type: 'list',
            name: 'a',
            message: '选择接下来的操作',
            choices: [
                new inquirer.Separator,
                '修改',
                '返回'
            ]
        }
    ]).then(data => {
        switch (data.a) {
            case '返回':
                per_time();
                break;
            case '修改':
                set_per_info_next();
                break;
        }
    })
}
//修改定时消息内容
function set_per_info_next() {
    console.clear();
    inquirer.prompt([
        {
            type: 'input',
            message: '输入修改后的内容',
            name: 'change',
            default: config.per_time_info.info
        }
    ]).then(data => {
        config.per_time_info.info = data.change;
        config.save();
        set_per_info();
    })
}
//设置定时时间
function set_per_time() {
    console.clear();
    inquirer.prompt([
        {
            type: 'number',
            message: `设置发送消息时间间隔，单位为秒，默认为1，当前设定数值为：${config.per_time_info.time}`,
            default: 1,
            name: 'time'
        }
    ]).then(data => {
        if (!isNaN(data.time)) {
            config.per_time_info.time = data.time;
            config.save();
            clearInterval(per);
            per = setInterval(() => {
                if (config.per_time_info.enable) {
                    for (let i = 0; i < config.per_groups.length; i++) {
                        let id = config.per_groups[i];
                        try {
                            app.sendGroupMsg(id, config.per_time_info.info);
                        } catch (error) {

                        }
                    }
                }
            }, 1000 * config.per_time_info.time);
            per_time();
        } else {
            set_per_time();
        }
    })
}
//控制面板发信息
function panel_send_msg() {

    console.clear();
    inquirer.prompt(manus.panel_send_msg).then(data => {
        console.clear();
        switch (data.target) {
            case '群':
                panel_send_msg_to_group();
                break;
            case '好友':
                panel_send_msg_to_friend();
                break;
            case '取消':
                panel();
                break;
        }
    })
}
//控制面板发信息=>好友
function panel_send_msg_to_friend() {
    console.clear();
    let get_friend_list = app.getFriendList();
    let obj: { [remark: string]: number } = {};
    for (let [k, v] of get_friend_list) {
        obj[v.remark] = k;
    }
    let list = Object.keys(obj);
    console.clear();
    inquirer.prompt([
        {
            type: 'list',
            pageSize: 20,
            choices: list,
            message: '选择好友',
            name: 'choice'
        }, {
            type: 'input',
            message: '输入你要发送的消息',
            name: 'msg'
        }
    ]).then(async data => {
        let id = obj[data.choice];
        let wait_send = ora('发送中').start();
        await app.sendPrivateMsg(id, data.msg).then(() => { wait_send.succeed('发送成功') });
        setTimeout(() => {
            wait_send.stop();
            panel();
        }, 2000)
    })
}
//控制面板发信息=>群
function panel_send_msg_to_group() {
    console.clear();
    let get_group_list = app.getGroupList();
    let obj: { [remark: string]: number } = {};
    for (let [k, v] of get_group_list) {
        obj[v.group_name] = v.group_id;
    }
    let list = Object.keys(obj);
    console.clear()
    inquirer.prompt([
        {
            type: 'list',
            pageSize: 20,
            choices: list,
            message: '选择群组',
            name: 'choice'
        }, {
            type: 'input',
            message: '输入你要发送的消息',
            name: 'msg'
        }
    ]).then(async data => {
        let id = obj[data.choice];
        let wait_send = ora('发送中').start();
        await app.sendGroupMsg(id, data.msg).then(() => { wait_send.succeed('发送成功') });
        setTimeout(() => {
            wait_send.stop();
            panel();
        }, 2000)
    })
}
App_start();
//qq上线后
function QQ_is_online() {
    //入群欢迎
    app.on('notice.group.increase', notice => {
        if (config.welcome.enable) {
            try {
                let at = segment.at(notice.user_id);
                let message = [at, config.welcome.info];
                notice.group.sendMsg(message);
            } catch (error) {

            }
        }
    });
    //关键词回复
    app.on('message.group', group_msg => {
        for (let i = 0; i < config.keywords_reply.length; i++) {
            if (group_msg.raw_message.includes(config.keywords_reply[i].key)) {
                group_msg.reply(config.keywords_reply[i].reply);
            }
        }
    })
    //挤下线处理
    app.on('system.offline.kickoff', () => {
        console.clear();
        let offline = ora('被挤下线了，即将退出······').start();
        setTimeout(() => {
            process.exit();
        }, 5000);
    })
}
//定时消息
var per = setInterval(() => {
    if (config.per_time_info.enable) {
        for (let i = 0; i < config.per_groups.length; i++) {
            let id = config.per_groups[i];
            try {
                app.sendGroupMsg(id, config.per_time_info.info);
            } catch (error) {

            }
        }
    }
}, 1000 * config.per_time_info.time);

function the_title(title: string) {
    let log = '----------------------------\n' + `\t${title}` + '\n----------------------------';
    return log;
}

function the_logo() {
    let logo = "   __     __            ____        _\n" +
        "   \\ \\   / /_ _ _ __   | __ )  ___ | |_\n" +
        "    \\ \\ / / _` | '_ \\  |  _ \\ / _ \\| __|\n" +
        "     \\ V / (_| | | | | | |_) | (_) | |_\n" +
        "      \\_/ \\__∧|_| |_| |____/ \\____^__|";
    console.log(logo);
}