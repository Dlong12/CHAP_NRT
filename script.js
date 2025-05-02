
let isImagery = true; // 当前是否为影像图
var imageryLayer = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
var streetLayer = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}')
    // 初始化地图
var map = L.map('map', {
    // crs: L.CRS.EPSG4326, 
    zoomControl: false,
    minZoom: 4,
}).setView([34, 105], 4); // 设置初始中心点和缩放级别
imageryLayer.addTo(map); // 添加影像图层

// 全图范围事件
document.getElementById('reset-view').addEventListener('click', function () {
    map.setView([34, 105], 4)
});
// 底图切换事件
document.getElementById('toggle-basemap').addEventListener('click', function () {
    if (isImagery) {
        map.removeLayer(imageryLayer);
        streetLayer.addTo(map);
    } else {
        map.removeLayer(streetLayer);
        imageryLayer.addTo(map);
    }
    isImagery = !isImagery; // 切换状态
});

/*
 * Function to load the PM data and add the image overlay to the map.
 * It fetches the JSON data from the specified URL, retrieves the image URL,
 * and adds it as an overlay on the map.
 */
let currentOverlay; // 用于存储当前的图片覆盖层

function loadPM25() {
    fetch("./O3/data/sta/index.json")
        .then(response => {
            if (response.ok) {
                return response.json();
            }
        })
        .then(pmIndex => {
            drawPm25(pmIndex);
        })
        .catch(error => {
            console.error('Error fetching JSON:', error);
        });
}


/*
 * Function to update the image overlay on the map.
 */
function updateImageOverlay(timestamp) {
    const imageUrl = `./O3/data/png/CHAP_NRT_O3_${timestamp}.png`;
    const imageBounds = [[54.0, 72.0], [11.5, 135.5]];

    // 如果已有覆盖层，先移除
    if (currentOverlay) {
        map.removeLayer(currentOverlay);
    }

    // 添加新的图片覆盖层
    currentOverlay = L.imageOverlay(imageUrl, imageBounds).addTo(map);
}


/*
 * Function to create a time slider control on the map.
 */
function drawPm25(pmIndex) {

    // 获取滑动条和标签元素
    const slider = document.getElementById('timeline-slider');
    const label = document.getElementById('timestamp');
    slider.max = pmIndex.length - 1; // 设置滑动条的最大值
    slider.value = 0; // 设置初始值为0
    updateImageOverlay(pmIndex[0]); // 初始化地图图片
    label.innerHTML = pmIndex[0];
    // 添加滑动事件监听器
    slider.addEventListener('input', function () {
        const index = parseInt(slider.value, 10);
        const timestamp = pmIndex[index];
        label.innerHTML = timestamp;
        updateImageOverlay(timestamp); // 更新地图图片
    });
}


/*
 * Function to load the GeoJSON data and add it to the map.
 */
function loadGeoJSON() {
    fetch('./prov.json') // 替换为你的 GeoJSON 文件路径
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to load GeoJSON');
        })
        .then(geojsonData => {
            // 使用 L.geoJSON 将 GeoJSON 数据添加到地图
            L.geoJSON(geojsonData, {
                style: function (feature) {
                    return {
                        color: '#1e78dc', // 边界颜色
                        weight: 1, // 边界宽度
                        fillOpacity: 0.1, // 填充透明度
                    };
                },
                onEachFeature: function (feature, layer) {
                    // 为每个 GeoJSON 特征添加弹窗
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup(`${feature.properties.name}`);
                    }
                }
            }).addTo(map);
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
        });
}

document.addEventListener('DOMContentLoaded', function () {
    loadPM25();
    loadGeoJSON();
});