var dt = dynamicTable.config('usefulDataTable', ['update_time', 'envTemp', 'surfaceAvgTemp', 'innerAvgTemp', 'maxTemp', 'minTemp'], ['时刻', '环境温度', '表层平均温度', '内层平均温度', '最高温', '最低温'], "数据加载中")
var myChart = echarts.init(document.getElementById('myChart'));
var showed = false;

myChart.setOption(option = {
    darkmode: true,
    visualMap: {
        show: false,
        min: 23,
        max: 33,
        inRange: {
            symbolSize: [5, 25],
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
            colorAlpha: [0.4, 1]
        }
    },
    xAxis3D: {
        type: 'value'
    },
    yAxis3D: {
        type: 'value'
    },
    zAxis3D: {
        type: 'value'
    },
    grid3D: {
        boxWidth: 100,
        boxHeight: 70,
        boxDepth: 200,
        axisLine: {
            lineStyle: { color: '#687694' }
        },
        axisPointer: {
            lineStyle: { color: '#687694' }
        },
        viewControl: {
            autoRotate: false
        }
    },
    series: [{
        type: 'scatter3D',
        encode: {
            x: 'x',
            y: 'y',
            z: 'z'
        }
    }]
});
option && myChart.setOption(option);

function updateChart(data) {
    myChart.setOption({
        dataset: {
            source: data
        }
    })
}

function checkPeak(data) {
    if (showed) {
        showed = false;
        return;
    }
    let max = data[0];
    let min = data[0];
    let sum = 0;
    let count = 0;
    let avg;
    data.forEach(element => {
        if (element.temp > max.temp) max = element;
        if (element.temp < min.temp) min = element;
        sum += element.temp;
        count++;
    });
    avg = sum / count;
    if (Math.abs(max.temp - avg) > 6) {
        document.getElementById("tempWarningInfo").innerHTML = "<p>在（" + max.x + ',' + max.y + ',' + max.z + "）位置温差过大</p><p>该位置温度为 " + max.temp + "</p>";
        $("#staticBackdropLive").modal("show");
        showed = true;
    };
    if (Math.abs(min.temp - avg) > 6) {
        document.getElementById("tempWarningInfo").innerHTML = "<p>在（" + max.x + ',' + max.y + ',' + max.z + "）位置温差过大</p><p>该位置温度为 " + max.temp + "</p>";
        $("#staticBackdropLive").modal("show");
        showed = true;
    }
}

$.getJSON("/fetch/?time=now").done(data => updateChart(data));

$.getJSON("/fetch/?useful=5").done(data => dt.load(data));

window.onresize = function () {
    myChart.resize();
};

window.setInterval(function () { $.getJSON("/fetch/?time=now").done(data => [updateChart(data), checkPeak(data)]); }, 5000)
window.setInterval(function () { $.getJSON("/fetch/?useful=5").done(data => dt.load(data)); }, 5000)
