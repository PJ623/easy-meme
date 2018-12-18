/*
    TODO:
    * UX
*/

function EasyMeme() {
    var Helper = {
        checkType: function checkType(data, type) {
            if (type && typeof type == "string") {
                if (typeof data == type)
                    return true;
            }
            return false;
        },
        getElement: function getElement(elementID) {
            var element = document.getElementById(elementID);

            if (!this.checkType(elementID, "string"))
                throw new Error("'" + elementID + "', is not a string.");
            else if (element == null)
                throw new Error("'" + elementID + "' cannot be found.");

            return element;
        },
        createElement: function createElement(typeOfElement) {
            if (!this.checkType(typeOfElement, "string"))
                throw new Error("'" + typeOfElement + "' is not a string.");

            return document.createElement(typeOfElement);
        },
        // Move to canvasManager or generalize further?
        TextWrapper: function TextWrapper(context) {
            var lineArray = [];

            return function wrapText(text, divider, maxWidth) {
                if (!divider)
                    divider = "";

                var splitText = text.split(divider);
                var filler = "";
                var leftovers = [];
                var result = "";

                for (let i = 0; i < splitText.length; i++) {
                    let token = splitText[i];
                    let tokenWidth = context.measureText(token).width;
                    resultWidth = context.measureText(result).width;
                    let nextResultWidth = resultWidth + tokenWidth;

                    if (nextResultWidth > maxWidth) {
                        for (let j = i; j < splitText.length; j++)
                            leftovers.push(splitText[j]);
                        break;
                    }

                    if (i > 0)
                        filler = divider;

                    result = result.concat(filler + token);
                }

                lineArray.push(result);

                if (leftovers.length > 0)
                    wrapText(leftovers.join(divider), divider, maxWidth);

                return lineArray;
            }
        },
        deepArrayToString: function deepArrayToString(arr, joiner) {
            if (!joiner)
                joiner = " ";

            for (let i = 0; i < arr.length; i++) {
                if (Array.isArray(arr[i]))
                    arr[i] = deepArrayToString(arr[i]);
            }

            return arr.join(joiner);
        }
    };

    function ImageManager() {
        var image;

        function createImage() {
            if (!image)
                return Helper.createElement("img");
        }

        var hideImage = function hideImage() {
            image.style.display = "none";
        }

        var showImage = function showImage() {
            image.style.display = "block";
        }

        // turn into changeImage
        var setImage = function setImage(src) {
            if (!Helper.checkType(src, "string"))
                console.error("'" + src + "' is not a string.");
            else
                image.src = src;
        }

        var getImage = function getImage() {
            return image;
        }

        var initiate = function initiate() {
            console.log("Initiating ImageManager...");
            image = createImage();
            this.setImage = setImage;
            this.getImage = getImage;
            this.hideImage = hideImage;
            this.showImage = showImage;
            console.log("ImageManager successfully initiated.");
        }

        return {
            initiate: initiate
        }
    }

    function CanvasManager() {
        var canvas;
        var context;

        // take in fontsize?
        var drawText = function drawText(text, x, y, settings) {
            context.font = settings.fontSize.toString().concat("px ") + settings.fontFamily;
            context.textBaseline = settings.textBaseline;
            context.fillText(text, x, y);
        }

        var save = function save() {
            context.save();
        }

        var restore = function restore() {
            context.restore();
        }

        var drawImage = function drawImage(image, x, y) {
            context.drawImage(image, x, y); // gonna have to make room for above text
        }

        var clear = function clear() {

        }

        var setBackgroundColor = function setBackgroundColor (color) {
            context.fillStyle = color;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.stroke();
        }

        var getContext = function getContext() {
            return context;
        }

        var setHeight = function setHeight(height) {
            if (!Helper.checkType(height, "number")) {
                console.error("'" + height + "' is not a number.");
                return;
            }
            canvas.height = height;
        }

        var getHeight = function getHeight() {
            return canvas.height;
        }

        var setWidth = function setWidth(width) {
            if (!Helper.checkType(width, "number")) {
                console.error("'" + width + "' is not a number.");
                return;
            }
            canvas.width = width;
        }

        var getWidth = function getWidth() {
            return canvas.width;
        }

        function bindCanvas(canvasID) {
            canvas = Helper.getElement(canvasID);
            context = canvas.getContext("2d");
        }

        var initiate = function initiate(canvasID) {
            console.log("Initiating CanvasManager...");
            this.setHeight = setHeight;
            this.getHeight = getHeight;
            this.setWidth = setWidth;
            this.getWidth = getWidth;
            this.drawImage = drawImage;
            this.drawText = drawText;

            this.save = save;
            this.restore = restore;
            this.getContext = getContext;
            this.setBackgroundColor = setBackgroundColor;

            bindCanvas(canvasID);
            console.log("CanvasManager successfully initiated.");
        }

        return {
            initiate: initiate
        };
    }

    // CURRY BOYS
    var upload = function upload(imageManager, canvasManager) {
        return function (src, text) {
            if (!Helper.checkType(src, "string"))
                console.warn("'" + src + "' is not a string.");

            var image;

            fetch(src)
                .then(
                    function (response) {
                        if (response.status !== 200) {
                            console.warn("Unexpected response (Status Code:" + response.status + ").");
                            return;
                        }

                        imageManager.setImage(src);
                        image = imageManager.getImage();

                        image.onload = function () {
                            // Move this stuff?
                            var fontSize;

                            // make more robust
                            function calculateFontSize() {
                                if (!text)
                                    return 0;
                                return (image.height / 18);
                            }

                            fontSize = calculateFontSize();
                            canvasManager.setWidth(image.width);
                            canvasManager.setHeight(image.height);

                            var context = canvasManager.getContext();
                            context.font = fontSize.toString().concat("px") + " Calibri";
                            context.textBaseline = "bottom";

                            var padding = fontSize/2;

                            // word breakdown stuff:
                            var splitText = text.split(" ");
                            var wrappedLettersArray = [];
                            for (let i = 0; i < splitText.length; i++) {
                                var letterWrapper = Helper.TextWrapper(context);
                                wrappedLettersArray.push(letterWrapper(splitText[i], "", canvasManager.getWidth() - (padding * 2)));
                            }

                            var auditedText = Helper.deepArrayToString(wrappedLettersArray);
                            var wordWrapper = Helper.TextWrapper(context);
                            var wrappedTextArray = wordWrapper(auditedText, " ", canvasManager.getWidth() - (padding * 2)); // CURRIED, FRIENDS

                            var textSpace = (padding * 2) + (wrappedTextArray.length * fontSize);
                            canvasManager.setHeight(image.height + textSpace); // reset height
                            context.save();
                            canvasManager.setBackgroundColor("#FFFFFF");
                            context.restore();
                            canvasManager.drawImage(image, 0, textSpace);

                            for (let i = 0; i < wrappedTextArray.length; i++) {
                                var line = wrappedTextArray[i];
                                canvasManager.drawText(line, padding, padding + (fontSize * (i + 1)), { fontSize: fontSize, fontFamily: "Calibri", textBaseline: "bottom" });
                            }
                        }
                    }
                ).catch(
                    function (e) {
                        console.error(e);
                    }
                );
        }
    }

    var initiate = function initiate(canvasID) {
        console.log("Initiating Easy Meme...");
        try {
            var imageManager = ImageManager();
            var canvasManager = CanvasManager();
            imageManager.initiate();
            imageManager.hideImage();
            canvasManager.initiate(canvasID);
            document.body.appendChild(imageManager.getImage()); // Put this somewhere cleaner
            this.upload = upload(imageManager, canvasManager); // CURRY!
        } catch (e) {
            console.error(e);
        }
        console.log("Easy Meme successfully initiated.");
    }

    return {
        initiate: initiate
    }
}

var easyMeme = EasyMeme();
easyMeme.initiate(/*"URL-text-box", "upload-button"*/ "result");

var textTextBox = document.getElementById("text-text-box");

var URLTextBox = document.getElementById("URL-text-box");
URLTextBox.value = "https://i.imgur.com/jzCwpMr.jpg"; // temporary

var uploadButton = document.getElementById("upload-button");
uploadButton.addEventListener("click", function () {
    easyMeme.upload(URLTextBox.value, textTextBox.value);
});