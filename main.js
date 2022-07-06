imagesToPaste = [];
function delSelected() {
    if (mainS.querySelector('.selected')) {
        for (const selected of mainS.querySelectorAll('.selected')) {
            selected.remove();
            selEditPoints.classList.add('hide');
        }
    }
    if (!imageEditPoints.classList.contains('hide')) {
        imageEditPoints.imgEl.remove();
        imageEditPoints.classList.add('hide');
    }
}
document.onkeydown = (e) => {
    if (e.key == 'Delete') {
        delSelected();
    }
}
isSelecting = false;
mainS.onpointerdown = (e) => {
    if (!currentPen) penList.querySelector('.pen').click();
    currentLine = [];
    newContext.classList.add('hide');
    e.stopPropagation();
    moved = 0;
    if ([2,4].includes(e.buttons) && e.pointerType == "pen") isSelecting = true;
    if ((e.buttons == 1 && e.pointerType == "pen" && ['pen', 'pressure', 'highlighter','fancy'].includes(currentPen.getAttribute('type'))) || isSelecting) {
        if(e.pointerType == "pen") mainS.classList.add('penDown');
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute("d", `M ${e.offsetX} ${e.offsetY}`);
        lastPressure = e.pressure;
        penType = isSelecting ? 'select' : currentPen.getAttribute('type');
        switch (penType) {
            case 'pressure':
                path.style.fill = currentPen.getAttribute('color');
                break;
            case 'pen':
                path.style.stroke = currentPen.getAttribute('color');
                path.style.strokeWidth = currentPen.getAttribute('size');
                break;
            case 'select':
                path.style.stroke = 'rgb(105 105 105)';
                path.style.strokeWidth = 1;
                path.style.strokeDasharray = '10, 10';
                path.style.fill = '#2b2b2b12';
                path.classList.add('selector');
                break;
            case 'highlighter':
                path.style.stroke = currentPen.getAttribute('color');
                path.style.strokeWidth = currentPen.getAttribute('size') * 8;
                path.style.mixBlendMode = 'multiply';
                path.style.strokeLinecap = 'square';
                break;
            case 'fancy':
                path.style.fill = currentPen.getAttribute('color');
                break;
            default:
                break;
        }
        mainS.appendChild(path)
        currentPath = path;
    }

    //Spawn Text
    if (currentPen.getAttribute('type') == "text" && e.path[0].nodeName != 'text' && e.path[1].nodeName != 'text' && txtEditorWrap.style.display != 'block') {
        text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.style.fill = currentPen.getAttribute('color');
        text.innerHTML = 'Text';
        text.setAttribute('x', Math.floor(e.clientX + window.pageXOffset));
        text.setAttribute('y', Math.floor(e.clientY + window.pageYOffset));
        text.style.fontSize = currentPen.getAttribute('size') * 6;
        text.classList = ['small']
        text.onclick = textEdit
        mainS.appendChild(text);
    }
}

minDiff = 1;
maxDiff = 10;

penWasUp = true;
lastP = [0, 0];
beforeLastP = [0, 0];
moved = 0;
var penHasPressure = false;
var lastDot = false;
var startedOnCanvas = false;

lastPressure = 0.1;
currentPath = null;
mainS.onpointermove = (e) => {
    if(!startedOnCanvas) return;
    if(!penHasPressure && e.pressure && e.pointerType == 'pen') penHasPressure = true; 
    moved += 1;
    if (!currentPen) penList.querySelector('.pen').click();
    if (!follow && imagesToPaste.length) {
        follow = document.createElement('img');
        follow.src = imagesToPaste.shift();
        follow.style.position = 'absolute';
        follow.style.height = window.visualViewport.height;
        document.body.append(follow)
    }
    if (e.buttons > 30 || (currentPen.getAttribute('type') == 'eraser' && e.buttons > 0)) {
        e.stopPropagation();
        rubberEl.style.display = 'block';
        rubberEl.style.left = e.pageX - 10;
        rubberEl.style.top = e.pageY - 10;
        e2ds = getElementsInRegion(e.clientX - 12.5, e.clientY - 12.5, 25, 25);
        for (const e2d of e2ds) {
            if (['line', 'path'].includes(e2d.nodeName)) {
                e2d.remove()
            }
        }

    } else if ((e.pointerType == 'pen' && ['pen', 'pressure', 'highlighter','fancy'].includes(currentPen.getAttribute('type'))) || isSelecting) {
        cP = [e.offsetX, e.offsetY];
        if (Math.abs(cP[0] - lastP[0]) > minDiff || Math.abs(cP[1] - lastP[1]) > minDiff) {
            e.stopPropagation();
            if ((e.buttons == 1 || isSelecting) && !(penHasPressure && !e.pressure)) {
                path = currentPath;
                if (currentPen.getAttribute('type') == 'pen' || isSelecting) {
                    path.setAttribute("d", `${path.getAttribute("d")} L${cP[0].toFixed(3)} ${cP[1].toFixed(3)}`);
                } else if (currentPen.getAttribute('type') == 'highlighter') {
                    path.setAttribute("d", `${path.getAttribute("d")} L${cP[0]} ${cP[1]}`);
                } else if (currentPen.getAttribute('type') == 'pressure') {
                    if (lastP.toString() == [0, 0].toString()) {
                        lastP = cP;
                        return;
                    }
                    bNV = Math.sqrt(Math.pow((cP[1] - lastP[1]), 2) + Math.pow((-cP[0] + lastP[0]), 2));
                    eNV = [(cP[1] - lastP[1]) / bNV, (-cP[0] + lastP[0]) / bNV];

                    pNV = [eNV[0] * currentPen.getAttribute('size') * e.pressure, eNV[1] * currentPen.getAttribute('size') * e.pressure];


                    var p1 = [cP[0] - pNV[0], cP[1] - pNV[1]];
                    var p2 = [cP[0] + pNV[0], cP[1] + pNV[1]];

                    if (!path.getAttribute("d").includes('S') && !path.getAttribute("d").includes('A')) {
                        p = path.getAttribute("d").replaceAll('M', '').replaceAll('Z', '').split(' ');
                        p = [parseFloat(p[1]), parseFloat(p[2])]
                        path.setAttribute("d", `M${p1[0].toFixed(2)} ${p1[1].toFixed(2)} A 1 1 0 0 1 ${(cP[0] + pNV[0]).toFixed(2)} ${(cP[1] + pNV[1]).toFixed(2)}Z`);
                    } else {

                        d = path.getAttribute("d");
                        bPs = d.split(" ");
                        bPs = [bPs[0].replaceAll('M', ''), bPs[1]];

                        bPe = d.replaceAll("Z", "").split("L").slice(-1)[0].split(" ");
                        bPe = [bPe[0], bPe[1]];


                        bPe = d.replaceAll("Z", "").split("L").slice(-1)[0].split(" ");
                        bPe2 = d.replaceAll("Z", "").split("S").slice(-1)[0].split(" ");
                        tRV = [(bPe2[2] - p2[0]), (bPe2[3] - p2[1])];
                        if (!tRV[0]) tRV = [0, 0];

                        bLeftSideE = Math.sqrt(Math.pow(bPe[0] - bPe2[2], 2) + (Math.pow(bPe[1] - bPe2[3], 2)));
                        bRightSideE = Math.sqrt(Math.pow(p2[0] - bPe[0], 2) + (Math.pow(p2[1] - bPe[1], 2)));
                        bShortSideE = bLeftSideE < bRightSideE ? bLeftSideE : bRightSideE;
                        if (!bShortSideE) bShortSideE = 0;

                        btRV = Math.sqrt(Math.pow(tRV[0], 2) + Math.pow(tRV[1], 2));
                        if (btRV == 0) btRV = 0.1;
                        teRV = [tRV[0] / btRV, tRV[1] / btRV];
                        if (bPe.length > 3) {
                            bPe = p2;
                        }
                        bEp = [(parseFloat(bPe[0]) + parseFloat(teRV[0]) * bShortSideE * 0.3).toFixed(2), (parseFloat(bPe[1]) + parseFloat(teRV[1]) * bShortSideE * 0.3).toFixed(2)];

                        bPs = d.replaceAll("Z", "").split("M")[1].split(" ")
                        bPs2 = bPs;
                        if (d.includes("S")) {
                            bPs2 = d.replaceAll("Z", "").split("S")[1].split(" ")
                        }
                        tRV = [(bPs2[2] - p1[0]), (bPs2[3] - p1[1])];
                        if (!tRV[0]) tRV = [0, 0]

                        bLeftSideS = Math.sqrt(Math.pow(bPe[0] - bPs2[2], 2) + (Math.pow(bPe[1] - bPs2[3], 2)));
                        bRightSideS = Math.sqrt(Math.pow(p1[0] - bPs[0], 2) + (Math.pow(p1[1] - bPs[1], 2)));
                        bShortSideS = bLeftSideS < bRightSideS ? bLeftSideS : bRightSideS;
                        if (!bShortSideS) bShortSideS = 0;

                        btRV = Math.sqrt(Math.pow(tRV[0], 2) + Math.pow(tRV[1], 2));
                        if (btRV == 0) btRV = 0.1;
                        teRV = [tRV[0] / btRV, tRV[1] / btRV];
                        bSn = [(bPs[0] - (teRV[0] * bShortSideS * 0.3)).toFixed(2), (bPs[1] - (teRV[1] * bShortSideS * 0.3)).toFixed(2)];
                        path.setAttribute("d", `M${p1[0]} ${p1[1]} S${bSn.join(" ")} ${parseFloat(bPs[0]).toFixed(2)} ${parseFloat(bPs[1]).toFixed(2)} ${path.getAttribute("d").replaceAll('Z', '').split("L").slice(0, path.getAttribute("d").includes('L') ? -1 : 1).join("L").split(" ").slice(2).join(" ")} S${bEp.join(" ")} ${parseFloat(bPe[0]).toFixed(2)} ${parseFloat(bPe[1]).toFixed(2)} L${p2[0]} ${p2[1]} Z`);
                   }
                } else if (currentPen.getAttribute('type') == 'fancy') {
                    currentLine.push([cP[0],cP[1],e.pressure]);
                    path.setAttribute("d", getSvgPathFromStroke(getStroke(currentLine,{
                        simulatePressure: false,
                        size: currentPen.getAttribute('size'),
                        thinning: fancyHardness.max-fancyHardness.value,
                        smoothing: fancySmoothing.value,
                        streamline: fancyStreamline.value
                      })));
                }
                lastPressure = e.pressure;

                beforeLastP = lastP;
                lastP = cP;

            }
        }
    } else {
        if(e.pointerType == "pen") mainS.classList.add('penHover');
    }
}

function textEdit(e) {
    elem = e.srcElement;
    if (elem.nodeName == 'tspan') elem = elem.parentElement;
    rec = elem.getClientRects()[0];
    txtEditorWrap.style.display = 'block';
    txtEditorWrap.style.top = rec.top + 1 + window.pageYOffset - 21;
    txtEditorWrap.style.left = rec.left + window.pageXOffset;
    comStyle = document.defaultView.getComputedStyle(elem);
    comFontSize = comStyle.fontSize;
    txtEditor.style.fontSize = comFontSize;
    tex = elem.innerHTML;
    tex = tex.replaceAll(/\<tspan(.*?)\>/gm, '<div>').replaceAll('</tspan>', '</div>')
    txtEditor.innerHTML = tex;
    txtEditor.focus();
    elem.style.visibility = 'hidden';
    txtEditor.onblur = () => {
        if (follow == txtEditorWrap) return;
        text = txtEditor.innerHTML;
        text = text.replaceAll('<div>', `<tspan x="${elem.getAttribute("x")}" dy="${comFontSize}">`);
        text = text.replaceAll('</div>', '</tspan>');
        elem.innerHTML = text;
        save2File();
        txtEditorWrap.style.display = 'none';
        elem.style.visibility = null;
    }
    txtEditor.drop = () => {
        rec = txtEditor.getClientRects()[0];
        elem.setAttribute("x", rec.left + window.pageXOffset - 8);
        elem.setAttribute("y", rec.top + window.pageYOffset + parseInt(elem.style.fontSize) - ((parseInt(elem.style.fontSize) / 10) + 8));
    }
}

var currentLine;
follow = null;
document.onpointermove = move;
document.onpointerup = (e) => {
    if(e.pointerType == "pen" && e.path.includes(mainS)) {mainS.classList.remove('penHover');mainS.classList.remove('penDown');};
    if (e.pointerType != 'pen' && moved < 5) {
        if (e.target.nodeName == 'image') {
            img = e.target;
            imageEditPoints.imgEl = img;
            imageEditPoints.classList.toggle('hide');
            imgRec = img.getBoundingClientRect();
            imgTR.style.top = imgRec.top + document.documentElement.scrollTop + window.pageYOffset;
            imgTR.style.left = imgRec.right + document.documentElement.scrollLeft + window.pageXOffset;
            imgTR.style.height = imgRec.height;
            imgBL.style.top = imgRec.bottom + document.documentElement.scrollTop + window.pageYOffset;
            imgBL.style.left = imgRec.left + document.documentElement.scrollLeft + window.pageXOffset;
            imgBL.style.width = imgRec.width;
            moveMiddle.style.top = ((imgRec.top + imgRec.bottom) / 2) + document.documentElement.scrollTop - (moveMiddle.getBoundingClientRect().height / 2) + window.pageYOffset;
            moveMiddle.style.left = ((imgRec.left + imgRec.right) / 2) + document.documentElement.scrollLeft - (moveMiddle.getBoundingClientRect().width / 2) + window.pageXOffset;
        } else {
            if (!imageEditPoints.classList.contains('hide')) imageEditPoints.classList.add('hide');
        }
    }
    if(moved < 6) {
        if(lastDot && Math.abs(e.offsetX - lastDot[0]) < 10 && Math.abs(e.offsetY  - lastDot[1]) < 10 ){
            if(lastDot[2] != null){
                mainS.lastChild.remove();
                lastDot[2].remove();
            }
            setTimeout(() => {
                openContext(e.offsetX,e.offsetY);
            }, 10);
        }
        var drawn = (getElementsInRegion(e.offsetX-1, e.offsetY-1, 2, 2, 0.3)).includes(mainS.lastChild);
        lastDot = [e.offsetX,e.offsetY,drawn?mainS.lastChild:null];
    } else {
        lastDot = false;
    }
    if (follow && follow.nodeName == 'IMG') {
        img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        img.setAttribute('href', follow.src);
        img.setAttribute('x', follow.style.left);
        img.setAttribute('y', follow.style.top);
        img.setAttribute('height', follow.style.height)
        follow.remove();
        mainS.appendChild(img);
    }
    if(e.path.includes(eraser)){
        delSelected();
    }
    follow = null
};
function move(e) {
    if (follow && (e.pressure > 0 || follow.nodeName == 'IMG')) {
        toFollow = follow;
        if (toFollow == txtEditorWrap) toFollow = toFollow.querySelector('.topHandle');
        if (follow != imgBL) follow.style.left = Math.floor(e.clientX + window.pageXOffset - (toFollow.getClientRects()[0].width / 2));
        if (follow != imgTR) follow.style.top = Math.floor(e.clientY + window.pageYOffset - (toFollow.getClientRects()[0].height / 2));
    }
    if ([moveMiddle, imgBL, imgTR].includes(follow)) {
        img = moveMiddle.parentElement.imgEl;
        if (follow == moveMiddle) {
            img.setAttribute("x", Math.floor(e.clientX + window.pageXOffset - (img.getBoundingClientRect().width / 2)));
            img.setAttribute("y", Math.floor(e.clientY + window.pageYOffset - (img.getBoundingClientRect().height / 2)));
        }
        if (follow == imgTR) {
            img.setAttribute("width", parseInt(imgTR.style.left) - parseInt(img.getAttribute("x")));
            img.removeAttribute("height");
        }
        if (follow == imgBL) {
            img.setAttribute("height", parseFloat(imgBL.style.top) - parseFloat(img.getAttribute("y")));
            img.removeAttribute("width");
        }
        imgRec = img.getBoundingClientRect();
        if (follow != moveMiddle) {
            moveMiddle.style.top = ((imgRec.top + imgRec.bottom) / 2) + document.documentElement.scrollTop - (moveMiddle.getBoundingClientRect().height / 2) + window.pageYOffset;
            moveMiddle.style.left = ((imgRec.left + imgRec.right) / 2) + document.documentElement.scrollLeft - (moveMiddle.getBoundingClientRect().width / 2) + window.pageXOffset;
        }
        imgTR.style.height = imgRec.height;
        imgBL.style.width = imgRec.width;
        if (follow != imgTR) {
            imgTR.style.top = imgRec.top + document.documentElement.scrollTop + window.pageYOffset;
            imgTR.style.left = imgRec.right + document.documentElement.scrollLeft + window.pageXOffset;
        }
        if (follow != imgBL) {
            imgBL.style.top = imgRec.bottom + document.documentElement.scrollTop + window.pageYOffset;
            imgBL.style.left = imgRec.left + document.documentElement.scrollLeft + window.pageXOffset;
        }


    } else if (selMoveMiddle == follow) {
        if (follow == selMoveMiddle) {
            moveRec = selMoveMiddle.getBoundingClientRect();
            deltaX = selMoveMiddle.getAttribute("lastX") - moveRec.x;
            deltaY = selMoveMiddle.getAttribute("lastY") - moveRec.y;
            for (const elem of mainS.querySelectorAll('.selected')) {
                if (elem.style.transform) {
                    lastTransXY = elem.style.transform.split('translate(')[1].split(')')[0].split(',');
                    lastTransX = parseFloat(lastTransXY[0]);
                    lastTransY = parseFloat(lastTransXY[1]);
                    elem.style.transform = `translate(${lastTransX - deltaX}px,${lastTransY - deltaY}px)`;
                } else {
                    elem.style.transform = `translate(${deltaX}px,${deltaY}px)`;
                }
            }
            selMoveMiddle.setAttribute("lastX", selMoveMiddle.getBoundingClientRect().x);
            selMoveMiddle.setAttribute("lastY", selMoveMiddle.getBoundingClientRect().y);
        }
    }
}

document.body.oncontextmenu = (e) => {
    // no context menu on selecting
    if (e.pointerType == 'pen' && moved > 20) {
        return false;
    }
}
lS = '';
selection = [];
mainS.onpointerup = (e) => {
    penWasUp = true

    if (currentPen.getAttribute('type') == 'pressure' && rubberEl.style.display == 'none') {
        lPath = mainS.querySelector('path:last-child');
        d = lPath.getAttribute('d');
        if (!d.includes('L') && !d.includes('S')) {
            p = d.replaceAll('M ', '').split(' ')
            if (p.length == 2) {
                lPath.setAttribute('d', `M ${p[0]} ${p[1]} L ${p[0] - 0.1} ${p[1] - 0.1}`)
                lPath.style.strokeWidth = currentPen.getAttribute('size') * lastPressure;
                lPath.style.stroke = currentPen.getAttribute('color');
                lPath.style.fill = '';
            }
        } else {
            lPath.setAttribute("d", `${d.replaceAll('Z', '')} A 2 2 0 0 1 ${d.split(" ")[0].slice(1)} ${d.split(" ")[1]}`);
        }
    }
    if (isSelecting) {
        selector = mainS.querySelector('.selector');
        for (let el of mainS.querySelectorAll('.selected')) {
            el.classList.remove('selected')
        }

        if (selector.getBoundingClientRect().height < 10 && selector.getBoundingClientRect().width < 10) {
            openContext(e.offsetX,e.offsetY);
        }

        selection = getElementsCoveredFully(selector);
        if (selection[0]) {
            maxX = 0;
            maxY = 0;
            minX = selection[0].getBoundingClientRect().left;
            minY = selection[0].getBoundingClientRect().top;
            for (let el of selection) {
                el.classList.add('selected');
                rec = el.getBoundingClientRect();
                if (rec.bottom > maxY) maxY = rec.bottom;
                if (rec.top < minY) minY = rec.top;
                if (rec.left < minX) minX = rec.left;
                if (rec.right > maxX) maxX = rec.right;
            }

            selMoveMiddle.style.top = ((minY + maxY) / 2) + document.documentElement.scrollTop - (selMoveMiddle.getBoundingClientRect().height / 2) + window.pageYOffset;
            selMoveMiddle.style.left = ((minX + maxX) / 2) + document.documentElement.scrollLeft - (selMoveMiddle.getBoundingClientRect().width / 2) + window.pageXOffset;
            selEditPoints.classList.remove('hide')
            selMoveMiddle.setAttribute("lastX", selMoveMiddle.getBoundingClientRect().x);
            selMoveMiddle.setAttribute("lastY", selMoveMiddle.getBoundingClientRect().y);
        }
        selector.remove();
    }
    lastP = [0, 0]
    rubberEl.style.display = 'none';
    lastChange = Date.now();
    isSelecting = false;
}
lastChange = 0;

setInterval(() => {
    if(Date.now()-lastChange > 4500){
        save2File()
    }
}, 5000);


dontScrollByPointer = false;
document.body.addEventListener("pointerdown", function (e) {
    startedOnCanvas = e.path.includes(mainS);
    if (e.pointerType === "pen" || e.path.includes(imageEditPoints) || e.path.includes(selEditPoints) || e.path.includes(txtEditorWrap)) {
        dontScrollByPointer = true;
    } else {
        dontScrollByPointer = false;
    }
    if (selection && !e.path.includes(selEditPoints) && !e.path.includes(eraser)) {
        selection = [];
        selEditPoints.classList.add('hide');
        for (let el of mainS.querySelectorAll('.selected')) {
            el.classList.remove('selected');
        }
    }
}, {
    capture: true
});
document.body.addEventListener("touchstart", function (e) {
    cy = e.touches[0].clientY;
    cx = e.touches[0].clientX;
    if (document.elementFromPoint(cx, cy) != mainS && document.elementFromPoint(cx, cy).parentElement != mainS && !e.path.includes(imageEditPoints) && !e.path.includes(selEditPoints) && !e.path.includes(txtEditorWrap)) {
        return;
    };
    if (dontScrollByPointer) {
        e.preventDefault();
    }
}, {
    passive: false,
    capture: false
});



function hscrollbar() {
    window.visualViewport.pageTop
    var top =
        window.pageYOffset ? window.pageYOffset :
            document.documentElement.scrollTop ? document.documentElement.scrollTop :
                document.body.scrollTop;
    document.getElementById('noteToolbar').style.top = top + window.visualViewport.offsetTop - 1;
    document.getElementById('penEditor').style.top = top + window.visualViewport.offsetTop + window.visualViewport.height * 0.06;
    var left =
        window.pageXOffset ? window.pageXOffset :
            document.documentElement.scrollLeft ? document.documentElement.scrollLeft :
                document.body.scrollLeft;
    document.getElementById('noteToolbar').style.left = left + window.visualViewport.offsetLeft;
    document.getElementById('penEditor').style.left = left + window.visualViewport.offsetLeft + (penEditor.getAttribute("leftOffToPen") * 1 / window.visualViewport.scale);

    document.getElementById('noteToolbar').style.transform = `scale(${1 / window.visualViewport.scale})`;
    document.getElementById('penEditor').style.transform = `scale(${1 / window.visualViewport.scale})`;
    document.getElementById('notesBar').style.transition = 'none';
    document.body.style.setProperty("--scale", 1 / window.visualViewport.scale);
    document.body.style.setProperty("--top", top + window.visualViewport.offsetTop);
    document.body.style.setProperty("--left", left + window.visualViewport.offsetLeft);
    setTimeout(() => {
        document.getElementById('notesBar').style.transition = null;
    }, 100);


    if (inflatePlane) {
        if (mainS.getBoundingClientRect().right - window.innerWidth < 0) {
            mainS.style.width = parseInt(mainS.style.width) - (mainS.getBoundingClientRect().right - window.innerWidth) + 20;
        }
        if (mainS.getBoundingClientRect().bottom - window.innerHeight < 0) {
            mainS.style.height = parseInt(mainS.style.height) - (mainS.getBoundingClientRect().bottom - window.innerHeight) + 20;
        }
    }
}
window.onscroll = hscrollbar;
window.onresize = hscrollbar;
window.visualViewport.onresize = hscrollbar;
window.visualViewport.onscroll = hscrollbar;

mainS.style.width = window.innerWidth;
mainS.style.height = window.innerHeight;

inflatePlane = true;



let fileHandle;
let wrStream;

async function openFile(fileHandle = null) {
    imageEditPoints.classList.add('hide');
    if (fileHandle == null) {
        [fileHandle] = await window.showOpenFilePicker();
    }

    if (fileHandle.kind === 'file') {
        lS = (await (await fileHandle.getFile()).text());
        mainS.innerHTML = lS;

        for (const txt of mainS.querySelectorAll('text')) {
            txt.onclick = textEdit;
        }

        maxX = window.innerWidth;
        maxY = window.innerHeight;
        for (const child of mainS.children) {
            rec = child.getClientRects()[0];
            if (rec) {
                right = rec.right;
                if (maxX < right) {
                    maxX = right;
                }
                bottom = rec.bottom;
                if (maxY < bottom) {
                    maxY = bottom;
                }
            }
        }
        mainS.style.height = maxY;
        mainS.style.width = maxX;
    }

}

async function save2File(data=mainS.innerHTML) {
    if(!fileHandle || lS == data) return;
    try {
        isSaving.classList.remove('hide');
        const writableStream = await fileHandle.createWritable();
        
        await writableStream.write(data);
        await writableStream.close();
        lS = data;
        isSaving.classList.add('hide');
    } catch (error) {
        console.log(error);
    }
    return 1;
}

// window.onclick = () => {
//     window.onclick = null;
//     openFile()
// }


function getElementsInRegion(x, y, width, height, p = 5) {

    var elements = [],
        cx = x,
        cy = y,
        curEl;

    height = y + height;
    width = x + width;

    while ((cy += p) < height) {
        cx = x;
        while ((cx += p) < width) {
            curEl = document.elementFromPoint(cx, cy);
            if (curEl && !elements.includes(curEl)) {
                elements.push(curEl);
            }
        }
    }

    return elements;

}


dirHandle = null;
async function openDir(dir = null, elementTo = dirFilesList, openRecent = false, keepOpen = false) {
    if (!dir) {
        oldHandle = await get('dirHandle');
        if (openRecent && oldHandle) {
            dirHandle = oldHandle;
            await dirHandle.requestPermission({ mode: "readwrite" })
        } else {
            dirHandle = await window.showDirectoryPicker({
                startIn: oldHandle,
                mode: "readwrite"
            });
            await dirHandle.requestPermission({ mode: "readwrite" })
            set('dirHandle', dirHandle);
        }
        dir = dirHandle;
    }
    if (elementTo != dirFilesList) {
        if (!dirFilesList.querySelector(`div.inDir[path="${elementTo.getAttribute('path')}"]`)) {
            e = document.createElement('div');
            e.classList = 'inDir';
            e.setAttribute('path', elementTo.getAttribute('path'))
            elementTo.after(e)
        }
        inDir = dirFilesList.querySelector(`div.inDir[path="${elementTo.getAttribute('path')}"]`);
        if (inDir.innerHTML != '' && !inDir.classList.contains('collapsed') && !keepOpen) {
            inDir.classList.add('collapsed');
        } else {
            inDir.classList.remove('collapsed');
        }
        inDir.dirHandle = dir;
        inDir.innerHTML = '';
    } else {
        inDir = dirFilesList;
        elementTo.innerHTML = '';
    }
    for await (const entry of dir.values()) {
        if (entry.kind == 'file' && entry.name.slice(-6).toLowerCase() != '.pnote') continue;
        e = document.createElement('div');
        e.classList = 'elem ' + entry.kind;
        e.setAttribute('name', entry.name);
        e.innerText = entry.kind == 'file' ? entry.name.slice(0, -6) : entry.name;
        if (entry.kind == 'directory') {
            e.setAttribute('path', elementTo.getAttribute('path') + '/' + entry.name);
        }
        e.onclick = async (event) => {
            let target = event.target;
            if (target.classList.contains('file')) {
                save2File().then(async ()=>{
                    fileHandle = await dir.getFileHandle(target.getAttribute('name'));
                    openFile(fileHandle);
                })
            } else if (target.classList.contains('directory')) {
                openDir(await dir.getDirectoryHandle(target.getAttribute('name')), target);
            }
        }
        inDir.appendChild(e)
    }
    adder = document.createElement('div');
    adder.classList = 'adder';
    adder.innerHTML = `<div onclick="this.nextElementSibling.classList.toggle('hide');">+</div>
        <div class="hide">
            <input type="text" placeholder="Name">
            <svg onclick="inp = this.previousElementSibling;if(inp.value){newElementInDir(${elementTo != dirFilesList ? 'this.parentElement.parentElement.parentElement.dirHandle' : 'dirHandle'},'dir',inp.value,${elementTo != dirFilesList ? 'this.parentElement.parentElement.parentElement.previousElementSibling' : 'dirFilesList'});inp.value=''}" style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M10,4L12,6H20A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4C2.89,20 2,19.1 2,18V6C2,4.89 2.89,4 4,4H10M15,9V12H12V14H15V17H17V14H20V12H17V9H15Z" /></svg>
            <svg onclick="inp = this.previousElementSibling.previousElementSibling;if(inp.value){newElementInDir(${elementTo != dirFilesList ? 'this.parentElement.parentElement.parentElement.dirHandle' : 'dirHandle'},'note',inp.value,${elementTo != dirFilesList ? 'this.parentElement.parentElement.parentElement.previousElementSibling' : 'dirFilesList'});inp.value=''}" style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H13.81C13.28 21.09 13 20.05 13 19C13 15.69 15.69 13 19 13C19.34 13 19.67 13.03 20 13.08V8L14 2M13 9V3.5L18.5 9H13M23 20H20V23H18V20H15V18H18V15H20V18H23V20Z" /></svg>
        </div>`;
    inDir.appendChild(adder);

    for (let p = 10; p < window.innerWidth; p += 2) {
        notesBar.style.width = p;
        if (dirFilesList.scrollWidth <= dirFilesList.clientWidth) {
            notesBar.style.width = p + 20;
            break;
        }
    }
}

async function newElementInDir(dir, type, name, refresh = null) {
    switch (type) {
        case 'dir':
            dir.getDirectoryHandle(name, {
                create: true,
            });
            break;
        case 'note':
            const newFileHandle = await dir.getFileHandle(name + '.pnote', { create: true });
            fileHandle = newFileHandle;
            openFile(newFileHandle);
            break;

        default:
            break;
    }
    if (refresh) {
        openDir(dir, refresh, false, true);
    }
}

function setCurrentPenType(type) {
    setPenElement(currentPen, currentPen.getAttribute('color'), currentPen.getAttribute('size'), type);
    penEditor.querySelector(`.types .penType[type=${type}]`).classList.add('active')
    for (const typeEl of penEditor.querySelectorAll('.types .penType')) {
        if (typeEl.getAttribute('type') != type) typeEl.classList.remove('active');
    }
}

currentPen = null;

function setPenElement(element, color, size, type) {
    svgD = '';
    switch (type) {
        case 'pen':
            svgD = `M9.75 20.85C11.53 20.15 11.14 18.22 10.24 17C9.35 15.75 8.12 14.89 6.88 14.06C6 13.5 5.19 12.8 4.54 12C4.26 11.67 3.69 11.06 4.27 10.94C4.86 10.82 5.88 11.4 6.4 11.62C7.31 12 8.21 12.44 9.05 12.96L10.06 11.26C8.5 10.23 6.5 9.32 4.64 9.05C3.58 8.89 2.46 9.11 2.1 10.26C1.78 11.25 2.29 12.25 2.87 13.03C4.24 14.86 6.37 15.74 7.96 17.32C8.3 17.65 8.71 18.04 8.91 18.5C9.12 18.94 9.07 18.97 8.6 18.97C7.36 18.97 5.81 18 4.8 17.36L3.79 19.06C5.32 20 7.88 21.47 9.75 20.85M18.96 7.33L13.29 13H11V10.71L16.67 5.03L18.96 7.33M22.36 6.55C22.35 6.85 22.04 7.16 21.72 7.47L19.2 10L18.33 9.13L20.93 6.54L20.34 5.95L19.67 6.62L17.38 4.33L19.53 2.18C19.77 1.94 20.16 1.94 20.39 2.18L21.82 3.61C22.06 3.83 22.06 4.23 21.82 4.47C21.61 4.68 21.41 4.88 21.41 5.08C21.39 5.28 21.59 5.5 21.79 5.67C22.08 5.97 22.37 6.25 22.36 6.55Z`;
            break;
        case 'highlighter':
            svgD = `M18.5,1.15C17.97,1.15 17.46,1.34 17.07,1.73L11.26,7.55L16.91,13.2L22.73,7.39C23.5,6.61 23.5,5.35 22.73,4.56L19.89,1.73C19.5,1.34 19,1.15 18.5,1.15M10.3,8.5L4.34,14.46C3.56,15.24 3.56,16.5 4.36,17.31C3.14,18.54 1.9,19.77 0.67,21H6.33L7.19,20.14C7.97,20.9 9.22,20.89 10,20.12L15.95,14.16`;
            break;
        case 'text':
            svgD = `M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z`
            break;
        case 'pressure':
            svgD = `M 9.75 20.85 C 11.53 20.15 10.915 18.665 9.721 17.268 C 8.392 15.893 7.828 15.195 6.634 14.113 C 6 13.5 5.19 12.8 4.54 12 C 4.26 11.67 3.69 11.06 4.27 10.94 C 4.86 10.82 5.88 11.4 6.4 11.62 C 7.31 12 8.031 12.739 8.955 13.325 L 10.239 11.027 C 8.5 10.23 6.5 9.32 4.64 9.05 C 3.58 8.89 2.46 9.11 2.1 10.26 C 1.78 11.25 2.083 12.243 2.87 13.03 C 4.809 14.722 6.003 15.713 7.242 16.614 C 8.256 17.471 8.527 17.628 9.203 18.192 C 9.788 18.665 10.104 19.318 9.608 19.634 C 8.617 20.062 3.975 17.471 4 18 L 4 18 C 4.02 18.665 7.88 21.47 9.75 20.85 M 18.96 7.33 L 13.29 13 H 11 V 10.71 L 16.67 5.03 L 18.96 7.33 M 22.36 6.55 C 22.35 6.85 22.04 7.16 21.72 7.47 L 19.2 10 L 18.33 9.13 L 20.93 6.54 L 20.34 5.95 L 19.67 6.62 L 17.38 4.33 L 19.53 2.18 C 19.77 1.94 20.16 1.94 20.39 2.18 L 21.82 3.61 C 22.06 3.83 22.06 4.23 21.82 4.47 C 21.61 4.68 21.41 4.88 21.41 5.08 C 21.39 5.28 21.59 5.5 21.79 5.67 C 22.08 5.97 22.37 6.25 22.36 6.55 Z`;
            break;
        case 'fancy':
            svgD = `M 9.75 20.85 C 11.53 20.15 10.915 18.665 9.721 17.268 C 8.392 15.893 7.828 15.195 6.634 14.113 C 6 13.5 5.19 12.8 4.54 12 C 4.26 11.67 3.69 11.06 4.27 10.94 C 4.86 10.82 5.88 11.4 6.4 11.62 C 7.31 12 8.031 12.739 8.955 13.325 L 10.239 11.027 C 8.5 10.23 6.5 9.32 4.64 9.05 C 3.58 8.89 2.46 9.11 2.1 10.26 C 1.78 11.25 2.083 12.243 2.87 13.03 C 4.809 14.722 6.003 15.713 7.242 16.614 C 8.256 17.471 8.527 17.628 9.203 18.192 C 9.788 18.665 10.104 19.318 9.608 19.634 C 8.617 20.062 3.975 17.471 4 18 L 4 18 C 4.02 18.665 7.88 21.47 9.75 20.85 M 18.96 7.33 L 13.29 13 H 11 V 10.71 L 16.67 5.03 L 18.96 7.33 M 22.36 6.55 C 22.35 6.85 22.04 7.16 21.72 7.47 L 19.2 10 L 18.33 9.13 L 20.93 6.54 L 20.34 5.95 L 19.67 6.62 L 17.38 4.33 L 19.53 2.18 C 19.77 1.94 20.16 1.94 20.39 2.18 L 21.82 3.61 C 22.06 3.83 22.06 4.23 21.82 4.47 C 21.61 4.68 21.41 4.88 21.41 5.08 C 21.39 5.28 21.59 5.5 21.79 5.67 C 22.08 5.97 22.37 6.25 22.36 6.55 Z M 7 4 L 8 4 L 8 3 L 9 4 L 10 3 L 10 4 L 11 4 L 10 5 L 11 6 L 10 6 L 10 7 L 9 6 L 8 7 L 8 6 L 7 6 L 8 5 L 7 4`;
            break;

        default:
            break;
    }
    element.innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="${svgD}" /></svg>`;
    element.style.color = color;
    element.style.transform = `scale(${1 + ((size - 3) / 20)})`;
    element.setAttribute('color', color);
    element.setAttribute('size', size);
    element.setAttribute('type', type);
    exportPens();
}


window.onload = async () => {
    pens = await get('penList');
    if (pens) {
        makePenList(pens);
        exportPens();
    } else {
        makePenList([{
            color: '#444444',
            size: '3',
            type: 'pen',
        },
        {
            color: '#4eb84c',
            size: '3',
            type: 'pen',
        },
        {
            color: '#d25b5b',
            size: '5',
            type: 'pressure',
        }, {
            color: '#fbff1f',
            size: '5',
            type: 'highlighter',
        }, {
            color: '#444444',
            size: '5',
            type: 'text',
        }]);
        exportPens();
    }
}
function makePenList(list) {
    penList.innerHTML = '';
    for (const pen of list) {
        e = document.createElement('div');
        e.classList = 'pen';
        setPenElement(e, pen.color, pen.size, pen.type);
        e.setAttribute('onclick', "setPenByElem(this)");
        penList.appendChild(e);
    }

    
    e = document.createElement('div');
    e.innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>`;
    e.style.color = 'darkgreen';
    e.onclick = addPen;
    penList.appendChild(e);
    
    e = document.createElement('div');
    e.classList = 'eraser';
    e.id = 'eraser';
    e.innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z" /></svg>`;
    e.style.color = 'salmon';
    e.setAttribute("type","eraser")
    e.setAttribute("onclick", "currentPen = this;this.classList.add('active');penList.querySelector('.pen.active').classList.remove('active');");
    penList.appendChild(e);
    
}

function setPenByElem(penElem) {
    if (penEditor.classList.contains('hide')) {
        if (currentPen == penElem) {
            penEditor.classList.remove('hide');
            penColorPick.value = currentPen.getAttribute('color');
            penEditor.style.setProperty('--background_color', penColorPick.value + '40')
            penThicknessSlide.value = currentPen.getAttribute('size');
            for (const type of penEditor.querySelectorAll('.types .penType')) {
                typeName = type.getAttribute('type');
                if (typeName == currentPen.getAttribute('type')) {
                    type.classList.add('active');
                } else {
                    type.classList.remove('active');
                }

            }
            penEditor.setAttribute("leftOffToPen", (penElem.getBoundingClientRect().left - noteToolbar.getBoundingClientRect().left) * window.visualViewport.scale);
            hscrollbar();
        }
    } else {
        penEditor.classList.add('hide');
    }
    for (const pen of penList.querySelectorAll('.pen')) {
        if (pen != penElem) pen.classList.remove('active');
    }
    penList.querySelector('.eraser').classList.remove('active');
    penElem.classList.add('active');
    currentPen = penElem;
}

function exportPens() {
    pens = [];
    for (const pen of penList.querySelectorAll('.pen')) {
        pens.push({
            color: pen.getAttribute('color'),
            size: pen.getAttribute('size'),
            type: pen.getAttribute('type')
        });
    }
    set('penList', pens);
}

async function addPen() {
    pens = await get('penList');
    console.log(pens);
    pens.push({
        color: '#444444',
        size: '3',
        type: 'pen',
    });
    makePenList(pens);
    exportPens();
}


function allowDrop(ev) {
    ev.preventDefault();
}


document.onpaste = function (event) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.kind === 'file') {
            var file = item.getAsFile();
            handleFileImport(file);
        }
    }
}

async function drop(ev) {
    ev.preventDefault();

    files = [];
    if (ev.dataTransfer.items) {
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            if (ev.dataTransfer.items[i].kind === 'file') {
                var file = ev.dataTransfer.items[i].getAsFile();
                files.push(file);
            }
        }
    } else {
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            files.push(file);
        }
    }
    for (const file of files) {
        await handleFileImport(file);
    }

}

async function handleFileImport(file) {
    if (file.type.includes('image/')) {
        imagesToPaste.push(await toBase64(file));
    }

    if (file.type.includes('application/pdf')) {
        var loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
        loadingTask.promise.then(function (pdf) {
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                pdf.getPage(pageNumber).then(function (page) {

                    var scale = 1.5;
                    var viewport = page.getViewport({ scale: scale });

                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    var renderTask = page.render(renderContext);
                    renderTask.promise.then(function () {
                        imagesToPaste.push(canvas.toDataURL());
                    });
                });
            }
        }, function (reason) {
            console.error(reason);
        });
    }
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

function getElementsCoveredFully(borderEl) {
    result = [];
    rec = borderEl.getBoundingClientRect();
    for (const element of mainS.children) {
        elementRec = element.getBoundingClientRect();
        if (elementRec.top > rec.top && elementRec.bottom < rec.bottom && elementRec.left > rec.left && elementRec.right < rec.right) {
            if (element.nodeName != 'path') {
                if (document.elementsFromPoint(elementRec.left, elementRec.top).includes(borderEl) &&
                    document.elementsFromPoint(elementRec.right, elementRec.top).includes(borderEl) &&
                    document.elementsFromPoint(elementRec.right, elementRec.bottom).includes(borderEl) &&
                    document.elementsFromPoint(elementRec.left, elementRec.bottom).includes(borderEl)) {
                    result.push(element)
                }
            } else {
                isInside = true;
                for (let l = 0; l < element.getTotalLength(); l++) {
                    p = element.getPointAtLength(l);
                    delta = [0, 0];
                    if (element.style.transform && element.style.transform.includes('translate(')) {
                        delta = element.style.transform.split('translate(')[1].split(')')[0].split(',');
                        delta[0] = parseFloat(delta[0])
                        delta[1] = parseFloat(delta[1])
                    }
                    if (!document.elementsFromPoint(p.x + delta[0] - (document.documentElement.scrollLeft + window.pageXOffset), p.y + delta[1] - (document.documentElement.scrollTop + window.pageYOffset)).includes(borderEl)) {
                        isInside = false;
                        continue;
                    }
                }
                if (isInside) {
                    result.push(element)
                }
            }
        }
    }
    return result;
}

function update() {
    navigator.serviceWorker.controller.postMessage('update');
}


navigator.serviceWorker.onmessage = (event) => {
    console.log(event);
    if (event.data && event.data.type === 'DONE') {
        logMessage('Update fertig', 'Seite wird neu geladen', 'lightgreen')
        setTimeout(() => {
            location.href = location.href;
        }, 1500);
    }
};

async function logMessage(title,text,color) {
    if(!document.querySelector('#logContainter')){
        var e = document.createElement('div');
        e.id = 'logContainter';
        document.body.appendChild(e);
    }
    var e = document.createElement('div');
    e.innerHTML = `<h4>${title}</h4><p>${text}</p>`;
    e.classList.add('logMessage');
    e.style.backgroundColor = color;
    logContainter.appendChild(e);
    await new Promise(res => setTimeout(res, 100));
    e.classList.add('expandedLog');
    await new Promise(res => setTimeout(res, 5500));
    e.classList.remove('expandedLog');
    await new Promise(res => setTimeout(res, 1000));
    e.remove();
}


// Fullscreen Btn
document.getElementsByTagName('html')[0].addEventListener('fullscreenchange', (event) => {
    if (document.fullscreenElement) {
        document.getElementById('toggle-fullscreen').innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M14,14H19V16H16V19H14V14M5,14H10V19H8V16H5V14M8,5H10V10H5V8H8V5M19,8V10H14V5H16V8H19Z" />
  </svg>`;
    } else {
        document.getElementById('toggle-fullscreen').innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z" />
  </svg>`;
    }
});

document.getElementById('toggle-fullscreen').addEventListener('click', (event) => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.getElementsByTagName('html')[0].requestFullscreen();
    }
});

// hide scrollbar
(function(timer) {
  window.addEventListener('load', function() {
    document.addEventListener('scroll', function(e) {
    (function(){
        document.body.classList.remove('hideScroll')
      clearTimeout(timer);
      timer = setTimeout(function() {
        document.body.classList.add('hideScroll')
      }, 300);    
    })();
    })
  })
})();

// No Context Menu
document.body.addEventListener("contextmenu", e => e.preventDefault());

// new context

function fillContext() {
    var pens = penList.querySelectorAll('.pen, .eraser');
    parentdiv = pensContext;
    parentdiv.innerHTML = '';
    var div = 360 / pens.length;
    var radius = 50;
    var offsetToParentCenter = parseInt(parentdiv.offsetWidth / 2); //assumes parent is square
    var offsetToChildCenter = 20;
    var totalOffset = offsetToParentCenter - offsetToChildCenter;
    for (let i = 0; i < pens.length; i++) {
        const pen = pens[i];
        var childdiv = document.createElement('div');
        childdiv.style.position = 'absolute';
        childdiv.style.transform = 'scale(2)';
        childdiv.innerHTML = pen.outerHTML;
        childdiv.querySelector('div').style.transform += ' scale(0.5)';
        childdiv.setAttribute("onclick","");
        childdiv.onclick = () => {
            pen.onclick();
            fillContext();
        }
        var y = Math.sin((div * i) * (Math.PI / 180)) * radius;
        var x = Math.cos((div * i) * (Math.PI / 180)) * radius;
        var x = Math.cos((div * i) * (Math.PI / 180)) * radius;
        childdiv.style.top = (y + totalOffset).toString() + "px";
        childdiv.style.left = (x + totalOffset).toString() + "px";
        parentdiv.appendChild(childdiv);
    }
}

function openContext(x,y) {
    fillContext();
    newContext.style.top = y;
    newContext.style.left = x;
    newContext.classList.remove('hide');
}