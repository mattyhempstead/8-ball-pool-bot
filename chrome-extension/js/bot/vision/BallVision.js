/*
    As readPixels on a webgl canvas returns the pixels upside down, the detect balls
    function will return the positions of balls with the y position flipped vertically.
    Thus I should remember to take this into account when using the ball positions.


    If the opponent does not hit the ball and gets timed out, their cue will
    appear in the frame when their turn ends.
    This is true for local games, but I will need to check this for a real game.

    Instead, I should detect the balls after my shot in the frame when
    it switches to the opponents turn.
    Then, if it turns out the opponent does not take a shot, the current set
    of detected balls should represent the current ball layout (as nothing
    should have moved since this frame was taken)
*/
console.log('BallVision.js');

BallVision = class {
    constructor(gameLoop) {
        this.gameLoop = gameLoop;

        this.balls = [];
        this.tempCanv = undefined;
        this.tempCtx = undefined;

        this.loadVisionModels();

        this.initTempCanvas(true);
    }

    loadVisionModels() {
        // Load vision models

		tf.loadLayersModel(chrome.extension.getURL('js/bot/vision/model-type/model.json')).then(evt=>{
            this.modelType = evt;
            console.log("got model", evt);
			// this.predict();
		})

		tf.loadLayersModel(chrome.extension.getURL('js/bot/vision/model-center/model.json')).then(evt=>{
            this.modelCenter = evt;
            console.log("got model", evt);
			// this.predict();
		})
    }

    /**
     * Get temporary canvas for ball detection.
     * Create if none already exists.
     */
    initTempCanvas(visible=true) {
        this.tempCanv = document.getElementById('tempCanv');
        if (this.tempCanv == null) {
            this.tempCanv = document.createElement('canvas');
            domContent.appendChild(this.tempCanv);
            this.tempCanv.id = 'tempCanv';
            this.tempCanv.width = tableRectOuter.w;
            this.tempCanv.height = tableRectOuter.h;
            this.tempCanv.style['width'] = tableRectOuter.w;
            this.tempCanv.style['height'] = tableRectOuter.h;
            this.tempCanv.style['border'] = '1px solid black';
            this.tempCanv.style['margin'] = '5px';
            this.tempCanv.style['margin-left'] = '106px';
            this.tempCanv.style['display'] = 'block';
        }
        this.tempCanv.style['visibility'] = visible ? 'visible' : 'hidden';
        this.tempCtx = this.tempCanv.getContext('2d');
    }

    /**
     * Scans the pool table and finds information about all pool balls.
     */
    async detectBalls() {
        console.log("detecting balls")

        // Note that this is flipped
        const imgData = new ImageData(
            this.gameLoop.gamePixelsPrevious, 
            this.gameLoop.gameCtx.drawingBufferWidth, 
            this.gameLoop.gameCtx.drawingBufferHeight
        );
        this.tempCtx.putImageData(imgData, -tableRectOuter.x, -(gh - tableRectOuter.y - tableRectOuter.h));
        // this.tempCtx.drawImage(gameCanvas, -tableRectOuter.x, -tableRectOuter.y)
    
        const tempCanvMat = cv.imread(this.tempCanv);
        // tempCanvMat = cv.matfromImageData(imgData);
    
        cv.cvtColor(tempCanvMat, tempCanvMat, cv.COLOR_RGB2GRAY);
        
        // Get circles
        const circleMat = new cv.Mat();
        // const PARAM_1 = 15
        // const PARAM_2 = 15
        // cv.HoughCircles(tempCanvMat, circleMat, cv.HOUGH_GRADIENT, 1, 25, PARAM_1, PARAM_2, 13, 15);
        // cv.HoughCircles(tempCanvMat, circleMat, cv.HOUGH_GRADIENT, 1, 13, 300, 10, 7, 13);
        cv.HoughCircles(tempCanvMat, circleMat, cv.HOUGH_GRADIENT, 1, 13, 300, 10, 10, 13);
    
        cv.cvtColor(tempCanvMat, tempCanvMat, cv.COLOR_GRAY2RGBA);
    
    
        // Remove all pre-existing findBallCenter canvases
        Array.from(document.getElementsByClassName('ballTempCanv'))
          .forEach(el => document.getElementById('dom-content').removeChild(el));
    
        // Draw circles on image
        this.balls = []
        for (let i = 0; i < circleMat.cols; ++i) {
            let x = circleMat.data32F[i * 3];
            let y = circleMat.data32F[i * 3 + 1];
            let radius = circleMat.data32F[i * 3 + 2];
    
    
            let center = new cv.Point(x, y);
            cv.circle(tempCanvMat, center, 0.5, [255, 0, 0, 255], 2);
            // cv.circle(tempCanvMat, center, 13, [255, 0, 0, 255], 1);
        

            const approxBallPos = { x, y };
            // this.sendDetectedBall(approxBallPos);
            this.balls.push(await this.findBallCenter(approxBallPos));
    
            let centerNew = new cv.Point(this.balls[i].x, this.balls[i].y);
            cv.circle(tempCanvMat, centerNew, 0.5, [0, 255, 0, 255], 2);
            cv.circle(tempCanvMat, centerNew, 13, [0, 255, 0, 255], 1);

            // console.log({x,y,radius}, this.balls[i]);
        }    
        console.log(`detected ${this.balls.length} balls`);
    
        cv.imshow(this.tempCanv, tempCanvMat);

        for (let ball of this.balls) {
            this.tempCtx.font = "20px monospace";
            this.tempCtx.fillText(ball.type, ball.x-6*(""+ball.type).length, ball.y-18);
        }

    }


    /**
     * Uses the approximate location of a pool ball determined by opencv to 
     * find a more accurate center.
     * @param {*} ball the ball (ball) -> 🎱
     */
    async findBallCenter(ball) {
        // Create a temp canvas to draw on
        const ballTempCanv = document.createElement('canvas');
        const ballTempCtx = ballTempCanv.getContext('2d');
        domContent.appendChild(ballTempCanv);
        ballTempCanv.classList.add('ballTempCanv');
        ballTempCanv.width = BALL_TEMP_CANV_SIZE;
        ballTempCanv.height = BALL_TEMP_CANV_SIZE;
        ballTempCanv.style.width = BALL_TEMP_CANV_SIZE;
        ballTempCanv.style.height = BALL_TEMP_CANV_SIZE;
        ballTempCanv.style.border = '1px solid black';
        ballTempCanv.style['margin-left'] = '5px';

        ballTempCtx.drawImage(
            tempCanv, 
            -ball.x + BALL_TEMP_CANV_SIZE/2, 
            -ball.y + BALL_TEMP_CANV_SIZE/2
        );

        const ballTempCanvMat = cv.imread(ballTempCanv);

        let pixelData = [];
        for (let i = 0; i < 32*32; i++) {
            pixelData.push(ballTempCanvMat.data[4*i    ] / 255);
            pixelData.push(ballTempCanvMat.data[4*i + 1] / 255);
            pixelData.push(ballTempCanvMat.data[4*i + 2] / 255);
        }

        const ballCenter = await this.predictBallCenter(pixelData);
        const ballType = await this.predictBallType(pixelData);

        let center = new cv.Point(
            16 + ballCenter[0], 
            16 + ballCenter[1]
        );
        cv.circle(ballTempCanvMat, center, 13, [0, 255, 0, 255], 1);
        cv.imshow(ballTempCanv, ballTempCanvMat);

        return {
            x: ball.x + ballCenter[0],
            y: ball.y + ballCenter[1],
            type: ballType
        };
    }

    async predictBallCenter(pixelData) {
        let modelInput = tf.tensor([pixelData]);
        modelInput = tf.reshape(modelInput, [1, 32, 32, 3]);
        const modelOutput = await this.modelCenter.predict(modelInput).data();
        return modelOutput;
    }

    async predictBallType(pixelData) {
        // // Model input is scaled to be 16x16
        // const scaledPixelData = [];
        // for (let y = 0; y < 16; y++) {
        //     for (let x = 0; x < 16; x++) {
        //         for (let c = 0; c < 3; c++) {                
        //             let pixelSum = 0;
        //             pixelSum += pixelData[3*(32*(2*y    ) + (2*x    )) + c];
        //             pixelSum += pixelData[3*(32*(2*y    ) + (2*x + 1)) + c];
        //             pixelSum += pixelData[3*(32*(2*y + 1) + (2*x    )) + c];
        //             pixelSum += pixelData[3*(32*(2*y + 1) + (2*x + 1)) + c];
        //             scaledPixelData.push(pixelSum / 4 / 255);
        //         }
        //     }
        // }

        // let modelInput = tf.tensor([scaledPixelData]);
        // modelInput = tf.reshape(modelInput, [1, 16, 16, 3]);

        let modelInput = tf.tensor([pixelData]);
        modelInput = tf.reshape(modelInput, [1, 32, 32, 3]);

        const modelOutput = await this.modelType.predict(modelInput).data();

        let type = -1;
        let weight = -1;
        for (let i = 0; i < 16; i++) {
            if (modelOutput[i] >= weight) {
                weight = modelOutput[i];
                type = i;
            }
        }
        return type;
    }


    /**
     * Sends a detected ball image to the listener on port 8001.
     */
    sendDetectedBall(ball) {
        // console.log(ball);

        // Create a temp canvas to draw on
        const ballTempCanv = document.createElement('canvas')
        const ballTempCtx = ballTempCanv.getContext('2d')
        domContent.appendChild(ballTempCanv)
        ballTempCanv.classList.add('ballTempCanv')
        ballTempCanv.width = BALL_TEMP_CANV_SIZE
        ballTempCanv.height = BALL_TEMP_CANV_SIZE
        ballTempCanv.style.width = BALL_TEMP_CANV_SIZE
        ballTempCanv.style.height = BALL_TEMP_CANV_SIZE
        ballTempCanv.style.border = '1px solid black'
        ballTempCanv.style['margin-left'] = '5px'

        ballTempCtx.drawImage(
            this.tempCanv, 
            -Math.round(ball.x) + BALL_TEMP_CANV_SIZE/2, 
            -Math.round(ball.y) + BALL_TEMP_CANV_SIZE/2,
        );
        ballTempCanvMat = cv.imread(ballTempCanv);
        
        cv.imshow(ballTempCanv, ballTempCanvMat);

        fetch('http://localhost:8001', {
            method: 'POST', 
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({'image-data': ballTempCanv.toDataURL()})
        });
    }

    convertTableToGamePos(pos) {
        return {
            x: pos.x + tableRectOuter.x, 
            y: tableRectOuter.y + tableRectOuter.h - pos.y,
        };
    }
}

