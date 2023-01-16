
import { _decorator, Component, Node, Label, resources, Prefab, instantiate } from 'cc';
import { ClientSocket } from './SocketIO/ClientSocket';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = GameController
 * DateTime = Fri Feb 18 2022 16:41:55 GMT+0700 (Indochina Time)
 * Author = hoantancong
 * FileBasename = GameController.ts
 * FileBasenameNoExtension = GameController
 * URL = db://assets/scripts/GameController.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('GameController')
export class GameController extends Component {
    @property(Label)
    yourNameLb: Label | null = null;
    @property(Label)
    yourScoreLb: Label | null = null;
    @property(Label)
    guessNameLb: Label | null = null;
    @property(Label)
    guessScoreLb: Label | null = null;
    @property(Label)
    roundLb: Label | null = null;
    @property(Label)
    statusLb: Label | null = null;

    //question
    @property(Label)
    levelQuestionLb: Label | null = null;

    @property(Node)
    private gamePlay: Node | null = null;
    //ui
    @property(Node)
    private menuUI: Node | null = null;
    public playerName: string = '';
    //is host
    private isHost: boolean = false;
    private gameQuestions:JSON | null = null;
    private roundQuestion:JSON | null = null;
    private yourScore:number = 0;
    private guessScore:number = 0;
    private gameRound:number = 0;
    private isAnswered:boolean = false;
    //
    private guessName:string = null;
    private hostName:string = null;
    //true and wrong mark
    @property(Node)
    private truefalseIcons:Node[] = [];
    //
    @property(Label)
    private guessAnswerStatus:Label | null = null;

    @property(Node)
    private truefalseGuessIcon:Node[] = [];
    //completed UI
    @property(Node)
    private completedUI:Node = null;
    @property(Label)
    private completedStatusLb:Label | null = null;
    start() {
        // [3]
        this.playerName = 'Gamer' + Math.round(Math.random() * 100);
    }
    //get question
    private getQuestionResource(callback:CallableFunction) {
        resources.load('game-question', (error, jsonAssets) => {
            callback(jsonAssets.json)
        })

    }
    public joinGame() {
        //join game
        ClientSocket.ins.Connect(this.node.getComponent(GameController));
    }

    public onSelectYes() {
        ClientSocket.ins.emitQuestionAnswer(true,this.playerName);
    }
    public onSelectNo() {
        ClientSocket.ins.emitQuestionAnswer(false,this.playerName);
    }
    //check player answer
    public checkAnswer(data:JSON){
        console.log('XXXX',data);
        if(this.isAnswered) return;
        this.isAnswered = true;
        if(data['player'] == this.playerName){
            //I'm answered
            console.log('Check ans:',data,this.roundQuestion['a'])
            if(data['answer']==this.roundQuestion['a']){
                //I'm answer true;
                this.truefalseIcons[0].active=true;
                //emit my score to server
                this.emitScore(1);
            }else{
                //false
                this.truefalseIcons[1].active=true;
                this.emitScore(0);
            }
        }else{
            //guess answer

            this.guessAnswerStatus.node.active=true;
            this.guessAnswerStatus.string = this.guessName+' answered '+data['answer'];
            if(data['answer']==this.roundQuestion['a']){
                //true
                this.truefalseGuessIcon[0].active=true;
            }else{
                //false
                this.truefalseGuessIcon[1].active=true;
            }
        }
    }
    private emitScore(score: number){
        //emit 1 score to playerName
        ClientSocket.ins.emitScoreToPlayer(this.playerName,score);
    }
    public youAreHost(data: any) {
        this.isHost = true;
        this.statusLb.string = "Room created, wait other player";
        this.menuUI.active = false;
    }
    public allPlayerJoinedRoom(data: any) {
        this.hostName = data.hostName;
        this.guessName = data.guessName;
        this.gameRound = 1;
        //set up
        this.yourNameLb.string = this.isHost?this.hostName:this.guessName;
        this.guessNameLb.string = this.isHost?this.guessName:this.hostName;
        if (this.isHost) {
            //generate question and send to server
            this.getQuestionResource((question) => {
                this.gameQuestions = question;
                //get first question
                let id = 'q1'
                let currentQuestion:JSON = this.gameQuestions[id];
                ClientSocket.ins.startTurn({'round':1,'content':currentQuestion})
            })
    
        }
    }
    public startGameWithQuestion(data: JSON) {
        this.gameRound=data['round']
        this.roundQuestion = data['content'];
        this.statusLb.node.active=false;
        //
        this.setUpGamePlay();
        
    }
    public getRoundScore(data: JSON) {
        if(data['score']==0){
            //no score -> do nothing
        }else{
            if(data['player']==this.playerName){
                console.log('Score:',data['score'])
                this.yourScore+=data['score']
                //update
                this.yourScoreLb.string = ''+this.yourScore;
            }else{
                //guess get score
                this.guessScore+=data['score']
                this.guessScoreLb.string = ''+this.guessScore;
            }
        }

        if(this.isHost){
            setTimeout(() => {
                this.nextQuestion();
            }, 1000);
        }
    }
    private nextQuestion(){
        this.isAnswered=false;
        //increase round
        if(this.gameRound==5){
            //game completed
            //emit all score to check who is winner
            if(this.yourScore>this.guessScore){
                //you win
                let yourName = this.isHost?this.hostName:this.guessName;
                ClientSocket.ins.gameCompleted(yourName);
            }else{
                //guess win
                let guessName = this.isHost?this.guessName:this.hostName;
                ClientSocket.ins.gameCompleted(guessName);
            }
          
        }else{
            //next question
            this.gameRound++;
            let id = 'q'+this.gameRound;
            let currentQuestion:JSON = this.gameQuestions[id];
            ClientSocket.ins.startTurn({'round':this.gameRound,'content':currentQuestion})
        }

    }
    private setUpGamePlay(){
        //hide all
        this.isAnswered=false;
        this.guessAnswerStatus.string='';
        this.guessAnswerStatus.node.active=false;
        //hide icon
        for(let i = 0;i<2;i++){
            this.truefalseIcons[i].active=false;
            this.truefalseGuessIcon[i].active=false;
        }
        this.gamePlay.active=true;
        this.roundLb.string = this.gameRound+'';
        this.yourScoreLb.string = ''+this.yourScore;
        this.guessScoreLb.string = ''+this.guessScore;
        this.levelQuestionLb.string = this.roundQuestion['q'];
        //start level 1
    }
    public setGameWinner(data:JSON){
        this.gamePlay.active=false;
        this.completedUI.active=true;
   
        let yourName = this.isHost?this.hostName:this.guessName;
        if(yourName==data['winner']){
            //you win
            this.completedStatusLb.string = 'YOU WIN';
        }else{
            //you lose
            this.completedStatusLb.string = 'YOU LOSE';
        }
    }
    public onRestartGame(){
        //
        this.completedUI.active=false;
        if(this.isHost){
            this.yourScore = 0;
            this.guessScore = 0;
            let id = 'q1'
            let currentQuestion:JSON = this.gameQuestions[id];
            ClientSocket.ins.startTurn({'round':1,'content':currentQuestion})
        }
        //
    }
    public clientLeftRoom(client:string){
        console.log('Client left:',client);
        resources.load('ui/MessageBox',(error,prefab:Prefab)=>{
            console.log('Prefab:',error);
            let box = instantiate(prefab);
            this.node.addChild(box);
        })
    }
    private startLevel(){
        //this.levelQuestionLb.string = this.gameQuestions.q1.
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
