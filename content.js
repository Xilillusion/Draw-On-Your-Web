if (!document.getElementById('web-draw-canvas')) {
    // --- Create Canvas ---
    const canvas = document.createElement('canvas');
    canvas.id = 'web-draw-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '10000';
    canvas.style.pointerEvents = 'auto';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    let drawing = false;
    let isErasing = false;
    let paths = [];
    let currentPath = [];

    function drawAllPaths() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paths.forEach(path => {
            if (path.length > 0) {
                ctx.strokeStyle = path[0].color;
                ctx.lineWidth = path[0].width;
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }
                ctx.stroke();
            }
        });
    }

    function getPathAtPoint(x, y) {
        for (let i = paths.length - 1; i >= 0; i--) {
            const path = paths[i];
            for (let j = 0; j < path.length - 1; j++) {
                const point1 = path[j];
                const point2 = path[j + 1];
                const distance = distanceToLineSegment(x, y, point1.x, point1.y, point2.x, point2.y);
                if (distance < Math.max(point1.width, 5)) {
                    return i;
                }
            }
        }
        return -1;
    }

    function distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
    }

    canvas.addEventListener('mousedown', e => {
        drawing = true;
        if (isErasing) {
            const pathIndex = getPathAtPoint(e.clientX, e.clientY);
            if (pathIndex !== -1) {
                paths.splice(pathIndex, 1);
                drawAllPaths();
            }
        } else {
            currentPath = [{
                x: e.clientX,
                y: e.clientY,
                color: ctx.strokeStyle,
                width: ctx.lineWidth
            }];
            ctx.beginPath();
            ctx.moveTo(e.clientX, e.clientY);
        }
    });

    canvas.addEventListener('mousemove', e => {
        if (drawing && !isErasing) {
            currentPath.push({
                x: e.clientX,
                y: e.clientY,
                color: ctx.strokeStyle,
                width: ctx.lineWidth
            });
            ctx.lineTo(e.clientX, e.clientY);
            ctx.stroke();
        } else if (drawing && isErasing) {
            const pathIndex = getPathAtPoint(e.clientX, e.clientY);
            if (pathIndex !== -1) {
                paths.splice(pathIndex, 1);
                drawAllPaths();
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (drawing && !isErasing && currentPath.length > 0) {
            paths.push(currentPath);
        }
        drawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        if (drawing && !isErasing && currentPath.length > 0) {
            paths.push(currentPath);
        }
        drawing = false;
    });

    // --- Create Toolbar ---
    const toolbar = document.createElement('div');
    toolbar.id = 'draw-toolbar';
    toolbar.style.position = 'fixed';
    toolbar.style.top = '10px';
    toolbar.style.right = '10px';
    toolbar.style.background = 'rgba(255, 255, 255, 0.8)';
    toolbar.style.border = '1px solid #ccc';
    toolbar.style.padding = '8px';
    toolbar.style.borderRadius = '8px';
    toolbar.style.zIndex = '10001';
    toolbar.style.display = 'flex';
    toolbar.style.flexDirection = 'column';
    toolbar.style.gap = '5px';
    document.body.appendChild(toolbar);

    // --- Color Picker ---
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#000000';
    colorInput.style.height = '40px';
    colorInput.style.border = 'none';
    colorInput.style.borderRadius = '4px';
    colorInput.style.cursor = 'pointer';
    colorInput.addEventListener('input', e => {
        ctx.strokeStyle = e.target.value;
        ctx.globalCompositeOperation = 'source-over';
    });
    toolbar.appendChild(colorInput);

    // --- Brush Size ---
    const sizeInput = document.createElement('input');
    sizeInput.type = 'range';
    sizeInput.min = '1';
    sizeInput.max = '20';
    sizeInput.value = '2';
    sizeInput.addEventListener('input', e => ctx.lineWidth = e.target.value);
    toolbar.appendChild(sizeInput);

    // --- Eraser Button ---
    const eraserBtn = document.createElement('button');
    eraserBtn.innerText = 'Eraser';
    eraserBtn.style.backgroundColor = '#f0f0f0';
    eraserBtn.style.padding = '5px 10px';
    eraserBtn.style.border = '1px solid #ccc';
    eraserBtn.style.borderRadius = '4px';
    eraserBtn.style.cursor = 'pointer';
    eraserBtn.addEventListener('click', () => {
        isErasing = true;
        eraserBtn.style.backgroundColor = '#ffcccc';
        drawBtn.style.backgroundColor = '#f0f0f0';
        canvas.style.cursor = 'crosshair';
    });
    toolbar.appendChild(eraserBtn);

    // --- Draw Button (to switch back from eraser) ---
    const drawBtn = document.createElement('button');
    drawBtn.innerText = 'Draw';
    drawBtn.style.backgroundColor = '#ccffcc';
    drawBtn.style.padding = '5px 10px';
    drawBtn.style.border = '1px solid #ccc';
    drawBtn.style.borderRadius = '4px';
    drawBtn.style.cursor = 'pointer';
    drawBtn.addEventListener('click', () => {
        isErasing = false;
        ctx.globalCompositeOperation = 'source-over';
        eraserBtn.style.backgroundColor = '#f0f0f0';
        drawBtn.style.backgroundColor = '#ccffcc';
        canvas.style.cursor = 'default';
    });
    toolbar.appendChild(drawBtn);

    // --- Button Container for Clear and Close ---
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '5px';
    buttonContainer.style.justifyContent = 'space-between';

    // --- Clear Button ---
    const clearBtn = document.createElement('button');
    clearBtn.innerText = 'Clear';
    clearBtn.style.padding = '5px 10px';
    clearBtn.style.border = '1px solid #ccc';
    clearBtn.style.borderRadius = '4px';
    clearBtn.style.cursor = 'pointer';
    clearBtn.style.flex = '1';
    clearBtn.addEventListener('click', () => {
        paths = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    buttonContainer.appendChild(clearBtn);

    // --- Close Drawing ---
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.style.padding = '5px 10px';
    closeBtn.style.border = '1px solid #ccc';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.flex = '1';
    closeBtn.addEventListener('click', () => {
        canvas.remove();
        toolbar.remove();
    });
    buttonContainer.appendChild(closeBtn);

    toolbar.appendChild(buttonContainer);

    // --- Keyboard Event Handler for Escape Key ---
    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            canvas.remove();
            toolbar.remove();
            document.removeEventListener('keydown', handleKeyPress);
        }
    };
    document.addEventListener('keydown', handleKeyPress);

    // --- Resize Canvas on Window Resize ---
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawAllPaths();
    });
}
