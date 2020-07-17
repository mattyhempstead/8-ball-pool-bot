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
    detectBalls() {
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
        const PARAM_1 = 15
        const PARAM_2 = 15
        // cv.HoughCircles(tempCanvMat, circleMat, cv.HOUGH_GRADIENT, 1, 25, PARAM_1, PARAM_2, 13, 15);
        cv.HoughCircles(tempCanvMat, circleMat, cv.HOUGH_GRADIENT, 1, 13, 300, 10, 7, 13);
    
    
        cv.cvtColor(tempCanvMat, tempCanvMat, cv.COLOR_GRAY2RGBA);
    
    
        // Remove all pre-existing findBallCentre canvases
        Array.from(document.getElementsByClassName('ballTempCanv'))
          .forEach(el => document.getElementById('dom-content').removeChild(el));
    
        // Draw circles on image
        this.balls = []
        for (let i = 0; i < circleMat.cols; ++i) {
            let x = circleMat.data32F[i * 3];
            let y = circleMat.data32F[i * 3 + 1];
            let radius = circleMat.data32F[i * 3 + 2];
    
            const approxBallPos = { x, y, radius, colour: [255, 0, 0, 255] }
    
            let center = new cv.Point(x, y);
            cv.circle(tempCanvMat, center, 0.5, [255, 0, 0, 255], 2);
            cv.circle(tempCanvMat, center, radius, [255, 0, 0, 255], 1);
            
            // sendDetectedBall(approxBallPos);
            
            // this.balls.push(this.findBallCentre(approxBallPos));
    
            // if (approxBallPos !== this.balls[i]) {
            //     let center = new cv.Point(x, y);
            //     cv.circle(tempCanvMat, center, radius, [255, 0, 0, 255], 1);
            //     cv.circle(tempCanvMat, center, 0.5, [255, 0, 0, 255], 2);
            // }
    
            // let centerNew = new cv.Point(this.balls[i].x, this.balls[i].y);
            // cv.circle(tempCanvMat, centerNew, this.balls[i].radius, this.balls[i].colour, 1);
            // cv.circle(tempCanvMat, centerNew, 1, [0, 255, 0, 255], 2);
    
            // console.log({x,y,radius}, this.balls[i])
        }
    
        // console.log(`detected ${this.balls.length} balls`);
    
        cv.imshow(this.tempCanv, tempCanvMat);
    }


    /**
     * Uses the approximate location of a pool ball determined by opencv to 
     * find a more accurate center.
     * @param {*} ball the ball (ball) -> 🎱
     */
    findBallCentre(ball) {
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
            tempCanv, 
            -ball.x + BALL_TEMP_CANV_SIZE/2, 
            -ball.y + BALL_TEMP_CANV_SIZE/2
        )

        ballTempCanvMat = cv.imread(ballTempCanv)


        // Convert to greyscale
        // cv.cvtColor(ballTempCanvMat, ballTempCanvMat, cv.COLOR_RGBA2GRAY)
        let center = new cv.Point(ball.x, ball.y);
        cv.circle(ballTempCanvMat, center, ball.radius, [0, 255, 0, 255], 1);

        cv.imshow(ballTempCanv, ballTempCanvMat);

        return ball;

        // // Get circles
        // let ballTempMat = new cv.Mat()
        // PARAM_1 = 100
        // PARAM_2 = 10
        // MIN_RADIUS = 14
        // MAX_RADIUS = 15
        // cv.HoughCircles(ballTempCanvMat, ballTempMat, cv.HOUGH_GRADIENT, 1, 20, PARAM_1, PARAM_2, MIN_RADIUS, MAX_RADIUS);

        
        // // If no circle can be found for some reason, simply return the original circle
        // if (ballTempMat.cols !== 1) {
        //     console.log(`failed to locate a single ball (found ${ballTempMat.cols})`)
        //     return ball
        // }


        // // Draw circle
        // cv.cvtColor(ballTempCanvMat, ballTempCanvMat, cv.COLOR_GRAY2RGBA)

        // let x = ballTempMat.data32F[0];
        // let y = ballTempMat.data32F[1];
        // let radius = ballTempMat.data32F[2];
        // let center = new cv.Point(x, y);
        // cv.circle(ballTempCanvMat, center, radius, [0, 255, 0, 255], 1);

        // cv.imshow(ballTempCanv, ballTempCanvMat);



        return {
            x: ball.x + x - BALL_TEMP_CANV_SIZE/2,
            y: ball.y - y + BALL_TEMP_CANV_SIZE/2,
            radius: radius,
            colour: [0, 255, 0, 255]
        }
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

}

