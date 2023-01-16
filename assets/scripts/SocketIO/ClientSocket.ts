
import { _decorator, Component, Node, game, director } from 'cc';
import { GameController } from '../GameController';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = ClientSocket
 * DateTime = Fri Feb 18 2022 16:22:26 GMT+0700 (Indochina Time)
 * Author = hoantancong
 * FileBasename = ClientSocket.ts
 * FileBasenameNoExtension = ClientSocket
 * URL = db://assets/scripts/SocketIO/ClientSocket.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
 
@ccclass('ClientSocket')
export class ClientSocket extends Component {
    public static URL  =  'http://localhost:3000/';
    public socket;
    public static ins: ClientSocket;
    start () {
        if (ClientSocket.ins == null) {
            director.addPersistRootNode(this.node)
            ClientSocket.ins = this;
        }

    }
    public Connect(gameController:GameController) {

        let play = (socketio) => {
            this.socket = socketio.connect(ClientSocket.URL);
            //listen server emit
            this.onListenFromServer(gameController);
        }
        //
        if (typeof io === 'undefined') {
            play(require("socket.io"));
        }
        else {
            play(io);
        }
    }
    private onListenFromServer(gameController:GameController){
        //server say hello
        this.socket.on('server-hello-client',(data)=>{
            console.log('Server say:',data);
            this.sendToServer('client-register-name', gameController.playerName);
            //-> reg name
        })
        //1. this is host
        this.socket.on('you-are-host',(data)=>{
            console.log('You are host of:'+data);
            gameController.youAreHost(data);
            //gameController.statusLb.string = 'Room created, please wait other player'
        })
        //2. all start
        this.socket.on('all-player-ready-start',(data)=>{

            gameController.allPlayerJoinedRoom(data)
        })
        //3. recieve question
        this.socket.on('server-send-question',(data)=>{
            gameController.startGameWithQuestion(data)
        })
        //4. recieve answer
        this.socket.on('player-answered-question',(data)=>{
            gameController.checkAnswer(data);
        })
        //5. recieve score from server
        this.socket.on('server-send-score-clients',(data)=>{
            //get round score
            console.log('score',data);
            gameController.getRoundScore(data)
        })
        //6. recieve game winner
        this.socket.on('server-send-winner',(data)=>{
            //get round score
            gameController.setGameWinner(data)
        })
        //7. client quit room
        this.socket.on('client-quit-room',(data)=>{
            //get round score
            gameController.clientLeftRoom(data)
        })
    }
    public emitQuestionAnswer(value:boolean,player:string){
        let answer = {'answer':value,'player':player}
        this.sendToServer('client-send-question-answer',answer);
    }
    public emitScoreToPlayer(playerName:string,score:number){
        console.log('Emit score:',playerName+"-"+score)
        this.sendToServer('emit-score-to-server',{'player':playerName,'score':score});
    }
    public gameCompleted(winner:string){
        this.socket.emit('emit-game-winner', {'winner':winner});
    }
    public startTurn(roundData){
        //roundData = round no, round question
        //this.sendToServer('emit-game-question',question)
        this.socket.emit('emit-game-question', roundData);
    }
    private sendToServer(connectionName: string,data: any){
        this.socket.emit(connectionName, data);
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.4/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.4/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.4/manual/en/scripting/life-cycle-callbacks.html
 */
