import * as fs from 'fs';
import path from 'path';
import ora from 'ora';
/**
 * 入群欢迎
 */
interface Welcome{
    enable: boolean;
    info: string
}
/**
 * 定时消息
 */
interface Per_time{
  enable: boolean;
  time: number;
  info: string
}
/**
 * 关键词回复
 */
interface itemOfKey{
    key:string;
    reply:string
}

class Config{
    per_groups!:number[];
    welcome!:Welcome;
    per_time_info!:Per_time;
    keywords_reply!:Array<itemOfKey>;
    constructor(){
        try{
            let buffer = fs.readFileSync(path.join(process.cwd(),'config.json'),'utf8');
            let config = JSON.parse(buffer);
            this.per_groups = config['per_groups']
            this.keywords_reply = config['keywords_reply'];
            this.per_time_info = config['per_time_info'];
            this.welcome = config['welcome'];
        }catch(err){
            console.log(err);
        }
    }
    /**
     * save
     */
    public save() {
        let wait =ora('保存配置')
        try{
            wait.start();
            fs.writeFileSync(path.join(process.cwd(),'config.json'),JSON.stringify(this));
            wait.succeed('保存成功');
        }catch(err){
            wait.fail('保存失败');
            console.log(err)
        }
    }
}

export = Config;

