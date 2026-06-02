class BuoyancySimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 物理常量
        this.g = 9.8; // 重力加速度 m/s²
        this.liquidColors = {
            water: 'rgba(52, 152, 219, 0.3)',
            saltwater: 'rgba(46, 204, 113, 0.3)',
            honey: 'rgba(241, 196, 15, 0.3)'
        };
        this.liquidDensities = {
            water: 1000,
            saltwater: 1030,
            honey: 1420
        }; // 各种液体的密度 kg/m³
        this.currentLiquid = 'water';
        this.waterDensity = this.liquidDensities[this.currentLiquid]; // 当前液体的密度 kg/m³
        this.pixelsPerMeter = 100; // 像素到米的转换比例
        
        // 水面位置
        this.waterLevel = 200;
        
        // 物体属性
        this.object = {
            x: 350, // 中心x坐标 (调整为新canvas尺寸)
            y: 120, // 中心y坐标
            size: 50, // 边长（像素）
            density: 800, // 密度 kg/m³
            isDragging: false,
            dragOffset: { x: 0, y: 0 }
        };
        
        // 底部嵌入物体属性
        this.bottomObject = {
            x: 500, // 中心x坐标
            y: this.canvas.height - 30, // 中心y坐标（紧贴底部）
            size: 60, // 边长（像素）
            density: 2000, // 密度 kg/m³（较重，确保沉底）
            visible: false // 默认不显示
        };
        
        // 矢量显示选项
        this.vectorOptions = {
            showTopPressure: true,
            showBottomPressure: true,
            showBuoyancy: true,
            showWeight: false,
            showBottomObject: false
        };
        
        this.initEventListeners();
        this.animate();
    }
    
    initEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 触摸事件（移动端支持）
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // 控制面板事件
        document.getElementById('objectDensity').addEventListener('input', (e) => {
            this.object.density = parseInt(e.target.value);
            document.getElementById('densityValue').textContent = e.target.value;
        });
        
        document.getElementById('objectSize').addEventListener('input', (e) => {
            this.object.size = parseInt(e.target.value);
            document.getElementById('sizeValue').textContent = e.target.value;
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.object.x = 350;
            this.object.y = 120;
        });

        document.getElementById('liquidType').addEventListener('change', (e) => {
            this.currentLiquid = e.target.value;
            this.waterDensity = this.liquidDensities[this.currentLiquid];
            document.getElementById('liquidDensityValue').textContent = this.waterDensity + ' kg/m³';
        });
        
        // 矢量显示选项事件
        document.getElementById('showTopPressure').addEventListener('change', (e) => {
            this.vectorOptions.showTopPressure = e.target.checked;
        });
        
        document.getElementById('showBottomPressure').addEventListener('change', (e) => {
            this.vectorOptions.showBottomPressure = e.target.checked;
        });
        
        document.getElementById('showBuoyancy').addEventListener('change', (e) => {
            this.vectorOptions.showBuoyancy = e.target.checked;
        });
        
        document.getElementById('showWeight').addEventListener('change', (e) => {
            this.vectorOptions.showWeight = e.target.checked;
        });
        
        document.getElementById('showBottomObject').addEventListener('change', (e) => {
            this.vectorOptions.showBottomObject = e.target.checked;
            this.bottomObject.visible = e.target.checked;
            
            // 控制底部物体数据面板的显示/隐藏
            const bottomPanel = document.getElementById('bottomObjectPanel');
            if (e.target.checked) {
                bottomPanel.style.display = 'block';
                this.updateBottomObjectPanel();
            } else {
                bottomPanel.style.display = 'none';
            }
        });
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    
    isPointInObject(x, y) {
        return x >= this.object.x - this.object.size/2 && 
               x <= this.object.x + this.object.size/2 &&
               y >= this.object.y - this.object.size/2 && 
               y <= this.object.y + this.object.size/2;
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        if (this.isPointInObject(pos.x, pos.y)) {
            this.object.isDragging = true;
            this.object.dragOffset.x = pos.x - this.object.x;
            this.object.dragOffset.y = pos.y - this.object.y;
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseMove(e) {
        if (this.object.isDragging) {
            const pos = this.getMousePos(e);
            this.object.x = pos.x - this.object.dragOffset.x;
            this.object.y = pos.y - this.object.dragOffset.y;
            
            // 限制物体在画布范围内
            this.object.x = Math.max(this.object.size/2, Math.min(this.canvas.width - this.object.size/2, this.object.x));
            this.object.y = Math.max(this.object.size/2, Math.min(this.canvas.height - this.object.size/2, this.object.y));
        }
    }
    
    handleMouseUp(e) {
        this.object.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        if (this.isPointInObject(pos.x, pos.y)) {
            this.object.isDragging = true;
            this.object.dragOffset.x = pos.x - this.object.x;
            this.object.dragOffset.y = pos.y - this.object.y;
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (this.object.isDragging) {
            const pos = this.getTouchPos(e);
            this.object.x = pos.x - this.object.dragOffset.x;
            this.object.y = pos.y - this.object.dragOffset.y;
            
            // 限制物体在画布范围内
            this.object.x = Math.max(this.object.size/2, Math.min(this.canvas.width - this.object.size/2, this.object.x));
            this.object.y = Math.max(this.object.size/2, Math.min(this.canvas.height - this.object.size/2, this.object.y));
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.object.isDragging = false;
    }
    
    calculatePhysics() {
        const objectTop = this.object.y - this.object.size/2;
        const objectBottom = this.object.y + this.object.size/2;
        
        // 计算物体在水中的深度
        let submergedDepth = 0;
        let topDepth = 0;
        let bottomDepth = 0;
        
        if (objectBottom > this.waterLevel) {
            if (objectTop > this.waterLevel) {
                // 完全在水中
                topDepth = (objectTop - this.waterLevel) / this.pixelsPerMeter;
                bottomDepth = (objectBottom - this.waterLevel) / this.pixelsPerMeter;
                submergedDepth = this.object.size / this.pixelsPerMeter;
            } else {
                // 部分在水中
                topDepth = 0; // 上表面在水面上，压力为大气压力（相对压力为0）
                bottomDepth = (objectBottom - this.waterLevel) / this.pixelsPerMeter;
                submergedDepth = (objectBottom - this.waterLevel) / this.pixelsPerMeter;
            }
        } else {
            // 完全在水面上方
            topDepth = 0;
            bottomDepth = 0;
            submergedDepth = 0;
        }
        
        // 计算压力 P = ρgh（相对于大气压力的表压）
        const topPressure = topDepth > 0 ? this.waterDensity * this.g * topDepth : 0;
        const bottomPressure = bottomDepth > 0 ? this.waterDensity * this.g * bottomDepth : 0;
        const pressureDiff = bottomPressure - topPressure;
        
        // 计算浮力 F = ρ_water * g * V_submerged
        // 对于立方体，浸没部分的体积 = 浸没深度 × 横截面积
        const crossSectionArea = Math.pow(this.object.size / this.pixelsPerMeter, 2); // 横截面积
        const submergedVolume = submergedDepth * crossSectionArea; // 浸没部分体积
        const buoyantForce = this.waterDensity * this.g * submergedVolume;
        
        // 计算重力
        const objectVolume = Math.pow(this.object.size / this.pixelsPerMeter, 3); // 立方体总体积
        const objectMass = this.object.density * objectVolume;
        const weight = objectMass * this.g;
        
        // 净力（向上为正）
        const netForce = buoyantForce - weight;
        
        return {
            topDepth,
            bottomDepth,
            topPressure,
            bottomPressure,
            pressureDiff,
            buoyantForce,
            weight,
            netForce,
            submergedDepth
        };
    }
    
    drawWater() {
        // 绘制水面
        this.ctx.fillStyle = this.liquidColors[this.currentLiquid];
        this.ctx.fillRect(0, this.waterLevel, this.canvas.width, this.canvas.height - this.waterLevel);
        
        // 绘制水面线
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.waterLevel);
        this.ctx.lineTo(this.canvas.width, this.waterLevel);
        this.ctx.stroke();
        
        // 水面标签
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 14px Arial';
        let liquidName = '';
        switch (this.currentLiquid) {
            case 'water': liquidName = '水'; break;
            case 'saltwater': liquidName = '盐水'; break;
            case 'honey': liquidName = '蜂蜜'; break;
        }
        this.ctx.fillText(liquidName + '面', 10, this.waterLevel - 10);
    }
    
    drawObject() {
        const objectTop = this.object.y - this.object.size/2;
        const objectBottom = this.object.y + this.object.size/2;
        
        // 绘制物体
        this.ctx.fillStyle = this.object.density < this.waterDensity ? '#27ae60' : '#e74c3c';
        this.ctx.fillRect(
            this.object.x - this.object.size/2,
            this.object.y - this.object.size/2,
            this.object.size,
            this.object.size
        );
        
        // 绘制物体边框
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.object.x - this.object.size/2,
            this.object.y - this.object.size/2,
            this.object.size,
            this.object.size
        );
        
        // 绘制物体中心点
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(this.object.x, this.object.y, 3, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawBottomObject() {
        if (!this.bottomObject.visible) return;
        
        // 确保底部物体紧贴底部
        const bottomY = this.canvas.height - this.bottomObject.size/2;
        
        // 绘制底部嵌入物体
        this.ctx.fillStyle = '#8e44ad'; // 紫色，表示底部嵌入物体
        this.ctx.fillRect(
            this.bottomObject.x - this.bottomObject.size/2,
            bottomY - this.bottomObject.size/2,
            this.bottomObject.size,
            this.bottomObject.size
        );
        
        // 绘制物体边框
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.bottomObject.x - this.bottomObject.size/2,
            bottomY - this.bottomObject.size/2,
            this.bottomObject.size,
            this.bottomObject.size
        );
        
        // 绘制物体中心点
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(this.bottomObject.x, bottomY, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 优化标签位置，避免与物体重叠
        this.ctx.fillStyle = '#8e44ad';
        this.ctx.font = 'bold 11px Arial';
        // 将标签放在物体左侧，避免重叠
        this.ctx.fillText('底部嵌入物体', this.bottomObject.x - this.bottomObject.size/2 - 90, bottomY - 15);
        this.ctx.fillText('(下方无液体，无浮力)', this.bottomObject.x - this.bottomObject.size/2 - 110, bottomY);
    }
    
    drawForceVectors(physics) {
        const arrowScale = 0.01; // 力矢量缩放因子
        const objectLeft = this.object.x - this.object.size/2;
        const objectRight = this.object.x + this.object.size/2;
        const objectTop = this.object.y - this.object.size/2;
        const objectBottom = this.object.y + this.object.size/2;
        
        // 绘制上表面压力矢量
        if (this.vectorOptions.showTopPressure && physics.topPressure > 0) {
            this.drawPressureArrows(objectTop, physics.topPressure, arrowScale, 'down', '#e74c3c');
        }
        
        // 绘制下表面压力矢量
        if (this.vectorOptions.showBottomPressure && physics.bottomPressure > 0) {
            this.drawPressureArrows(objectBottom, physics.bottomPressure, arrowScale, 'up', '#FFD700');
        }
        
        // 绘制浮力矢量
        if (this.vectorOptions.showBuoyancy && physics.buoyantForce > 0) {
            this.drawForceArrow(
                this.object.x + this.object.size/2 + 30,
                this.object.y,
                physics.buoyantForce * arrowScale,
                'up',
                '#3498db',
                '浮力'
            );
        }
        
        // 绘制重力矢量
        if (this.vectorOptions.showWeight) {
            this.drawForceArrow(
                this.object.x - this.object.size/2 - 30,
                this.object.y,
                physics.weight * arrowScale,
                'down',
                '#e74c3c',
                '重力'
            );
        }
    }
    
    drawPressureArrows(y, pressure, scale, direction, color) {
        const arrowLength = pressure * scale;
        const arrowCount = 2;
        const spacing = this.object.size / (arrowCount + 1);
        
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;
        
        for (let i = 1; i <= arrowCount; i++) {
            const x = this.object.x - this.object.size/2 + i * spacing;
            this.drawArrow(x, y, arrowLength, direction);
        }
    }
    
    drawForceArrow(x, y, length, direction, color, label) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 3;
        
        this.drawArrow(x, y, length, direction);
        
        // 绘制标签
        this.ctx.font = 'bold 14px Arial';
        const textY = direction === 'up' ? y - length - 10 : y + length + 20;
        this.ctx.fillText(label, x - 15, textY);
    }
    
    drawArrow(x, y, length, direction) {
        const arrowHeadSize = 8;
        
        this.ctx.beginPath();
        if (direction === 'up') {
            // 箭头向上
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y - length);
            // 箭头头部
            this.ctx.moveTo(x - arrowHeadSize, y - length + arrowHeadSize);
            this.ctx.lineTo(x, y - length);
            this.ctx.lineTo(x + arrowHeadSize, y - length + arrowHeadSize);
        } else {
            // 箭头向下
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + length);
            // 箭头头部
            this.ctx.moveTo(x - arrowHeadSize, y + length - arrowHeadSize);
            this.ctx.lineTo(x, y + length);
            this.ctx.lineTo(x + arrowHeadSize, y + length - arrowHeadSize);
        }
        this.ctx.stroke();
    }
    
    calculateBottomObjectPhysics() {
        // 底部嵌入物体的物理计算
        const objectSize = this.bottomObject.size / this.pixelsPerMeter; // 转换为米
        const objectDepthInLiquid = 0.3; // 假设物体在液体中的深度为0.3米
        
        // 上表面压力（物体顶部在液体中）
        const topPressure = this.waterDensity * this.g * objectDepthInLiquid;
        
        // 下表面压力（紧贴底部，无液体压力）
        const bottomPressure = 0;
        
        // 压力差（向下为负）
        const pressureDiff = bottomPressure - topPressure;
        
        // 浮力计算：由于下方无液体，实际浮力为0
        const buoyantForce = 0;
        
        // 重力计算
        const objectVolume = Math.pow(objectSize, 3); // 立方体体积
        const objectMass = this.bottomObject.density * objectVolume;
        const weight = objectMass * this.g;
        
        // 净力（重力向下，无浮力抵消）
        const netForce = buoyantForce - weight;
        
        return {
            topPressure,
            bottomPressure,
            pressureDiff,
            buoyantForce,
            weight,
            netForce,
            objectDepthInLiquid
        };
    }
    
    updateBottomObjectPanel() {
        const physics = this.calculateBottomObjectPhysics();
        
        document.getElementById('bottomDepth').textContent = physics.objectDepthInLiquid.toFixed(2) + ' m';
        document.getElementById('bottomTopPressure').textContent = physics.topPressure.toFixed(0) + ' Pa';
        document.getElementById('bottomBottomPressure').textContent = physics.bottomPressure + ' Pa';
        document.getElementById('bottomPressureDiff').textContent = physics.pressureDiff.toFixed(0) + ' Pa';
        document.getElementById('bottomBuoyantForce').textContent = physics.buoyantForce.toFixed(2) + ' N';
        document.getElementById('bottomWeight').textContent = physics.weight.toFixed(2) + ' N';
        
        // 净力显示优化，显示方向
        const netForceText = physics.netForce.toFixed(2) + ' N';
        const netForceDirection = physics.netForce > 0 ? ' (↑)' : physics.netForce < 0 ? ' (↓)' : '';
        document.getElementById('bottomNetForce').textContent = netForceText + netForceDirection;
    }
    
    updateInfoPanel(physics) {
        document.getElementById('depth').textContent = physics.submergedDepth.toFixed(2) + ' m';
        document.getElementById('topPressure').textContent = physics.topPressure.toFixed(0) + ' Pa';
        document.getElementById('bottomPressure').textContent = physics.bottomPressure.toFixed(0) + ' Pa';
        document.getElementById('pressureDiff').textContent = physics.pressureDiff.toFixed(0) + ' Pa';
        document.getElementById('buoyantForce').textContent = physics.buoyantForce.toFixed(2) + ' N';
        document.getElementById('weight').textContent = physics.weight.toFixed(2) + ' N';
        
        // 净力显示优化，显示方向
        const netForceText = physics.netForce.toFixed(2) + ' N';
        const netForceDirection = physics.netForce > 0 ? ' (↑)' : physics.netForce < 0 ? ' (↓)' : '';
        document.getElementById('netForce').textContent = netForceText + netForceDirection;
    }
    
    animate() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算物理量
        const physics = this.calculatePhysics();
        
        // 绘制各个元素
        this.drawWater();
        this.drawObject();
        this.drawBottomObject();
        this.drawForceVectors(physics);
        
        // 更新信息面板
        this.updateInfoPanel(physics);
        
        // 继续动画循环
        requestAnimationFrame(() => this.animate());
    }
}

// 初始化模拟
document.addEventListener('DOMContentLoaded', () => {
    new BuoyancySimulation();
});
