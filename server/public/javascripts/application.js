var rawData = null

function setRawData(newRawData) {
    rawData = newRawData
    series = prepareSeries(rawData)
}

var view = null

function setView(newView) {
    view = newView;
    refresh();
}

var sourceResolution = 10
var resolution = 60

function setResolution(newResolution) {
    resolution = newResolution;
    series = prepareSeries(rawData)
    refresh();
}

var series = null

function refresh() {
    document.getElementById("charts").innerHTML = ""
    setTimeout(function() {
        if(view == "overview") {
            createOverviewCharts();
        } else if(view == "young") {
            createYoungGenCharts();
        } else if(view == "old") {
            createOldGenCharts();
        }
    }, 10);
}

function list_average(list, sourceResolution, targetResolution) {
    if(sourceResolution == targetResolution) {
        return list;
    }
    var chunks = targetResolution / sourceResolution;
    var len = list.length;
    var res = []
    for(var i = 0; i <= len - chunks; i += chunks) {
        var sum = 0;
        for(var j = 0; j < chunks; j++) {
            sum += list[i + j]
        }
        res.push(sum / chunks)
    }
    return res;
}

function list_average_per_sec(list, sourceResolution, targetResolution) {
    if(sourceResolution == targetResolution) {
        return list;
    }
    var chunks = targetResolution / sourceResolution;
    var len = list.length;
    var res = []
    for(var i = 0; i <= len - chunks; i += chunks) {
        var sum = 0;
        for(var j = 0; j < chunks; j++) {
            sum += list[i + j]
        }
        res.push(sum / targetResolution)
    }
    return res;
}

function list_sum(list, sourceResolution, targetResolution) {
    if(sourceResolution == targetResolution) {
        return list;
    }
    var chunks = targetResolution / sourceResolution;
    var len = list.length;
    var res = []
    for(var i = 0; i <= len - chunks; i += chunks) {
        var sum = 0;
        for(var j = 0; j < chunks; j++) {
            sum += list[i + j]
        }
        res.push(sum)
    }
    return res;
}

function prepareSeries(list) {
    var young = list[0];
    var old = list[1];

    var heap = list_average(young[0], sourceResolution, resolution);
    var collections = list_sum(young[1], sourceResolution, resolution);
    var garbage = list_average_per_sec(young[2], sourceResolution, resolution);
    var garbage_old = list_average_per_sec(young[3], sourceResolution, resolution);
    var promoted = list_average_per_sec(young[4], sourceResolution, resolution);
    var allocated = []
    var cpu_ms = list_average_per_sec(young[5], sourceResolution, resolution);
    var real_ms = list_average_per_sec(young[6], sourceResolution, resolution);
    var cpu = [];
    var cpu_pct = [];
    var real = [];
    var promoted_pct = [];
    var cpu_avg = [];
    var real_avg = [];

    var len = heap.length;
    for(var i = 0; i < len; i++) {
        allocated.push(garbage[i] + promoted[i])
        cpu.push(cpu_ms[i] / 1000)
        cpu_pct.push(Math.round(100 * cpu_ms[i] / 1000))
        real.push(real_ms[i] / 1000)

        cpu_avg.push(Math.round(cpu_ms[i] / Math.max(1, collections[i] / resolution)))
        real_avg.push(Math.round(real_ms[i] / Math.max(1, collections[i] / resolution)))

        var fact = promoted[i] / Math.max(1, (promoted[i] + garbage[i]))
        promoted_pct.push(Math.round(10000 * fact) / 100)
    }

    var initmark_cpu = list_average_per_sec(old[0], sourceResolution, resolution);
    var initmark_real = list_average_per_sec(old[1], sourceResolution, resolution);
    var mark_cpu = list_average_per_sec(old[2], sourceResolution, resolution);
    var mark_real = list_average_per_sec(old[3], sourceResolution, resolution);
    var preclean_cpu = list_average_per_sec(old[4], sourceResolution, resolution);
    var preclean_real = list_average_per_sec(old[5], sourceResolution, resolution);
    var abortable_preclean_cpu = list_average_per_sec(old[6], sourceResolution, resolution);
    var abortable_preclean_real = list_average_per_sec(old[7], sourceResolution, resolution);
    var remark_cpu = list_average_per_sec(old[8], sourceResolution, resolution);
    var remark_real = list_average_per_sec(old[9], sourceResolution, resolution);
    var sweep_cpu = list_average_per_sec(old[10], sourceResolution, resolution);
    var sweep_real = list_average_per_sec(old[11], sourceResolution, resolution);
    var reset_cpu = list_average_per_sec(old[12], sourceResolution, resolution);
    var reset_real = list_average_per_sec(old[13], sourceResolution, resolution);
    var old_collections = list_sum(old[14], sourceResolution, resolution);
    var old_cpu = []
    var old_cpu_pct = []
    var total_cpu = []
    var total_cpu_pct = []

    len = mark_cpu.length;
    for(var i = 0; i < len; i++) {
        var old = initmark_cpu[i] + mark_cpu[i] + preclean_cpu[i] + abortable_preclean_cpu[i] + sweep_cpu[i] + remark_cpu[i] + reset_cpu[i]        
        old_cpu.push(Math.round(old))
        old_cpu_pct.push(Math.round(100 * old))
        var total = cpu[i] + old
        total_cpu.push(Math.round(total))
        total_cpu_pct.push(Math.round(100 * total))
    }

    var res = {}

    res.heap = heap
    res.collections = collections
    res.garbage = garbage
    res.garbage_old = garbage_old
    res.promoted = promoted
    res.allocated = allocated
    res.cpu = cpu
    res.cpu_pct = cpu_pct
    res.cpu_avg = cpu_avg
    res.real = real
    res.real_avg = real_avg
    res.promoted_pct = promoted_pct

    res.old_collections = old_collections
    res.initmark_cpu = initmark_cpu
    res.initmark_real = initmark_real
    res.mark_cpu = mark_cpu
    res.mark_real = mark_real
    res.preclean_cpu = preclean_cpu
    res.preclean_real = preclean_real
    res.abortable_preclean_cpu = abortable_preclean_cpu
    res.abortable_preclean_real = abortable_preclean_real
    res.remark_cpu = remark_cpu
    res.remark_real = remark_real
    res.sweep_cpu = sweep_cpu
    res.sweep_real = sweep_real
    res.reset_cpu = reset_cpu
    res.reset_real = reset_real
    res.old_cpu = old_cpu
    res.old_cpu_pct = old_cpu_pct
    res.total_cpu = total_cpu
    res.total_cpu_pct = total_cpu_pct

    return res;
}

var nextContainerId = 0;
    function createContainer() {
        var div = document.createElement("div");
        div.id = "container-" + nextContainerId++
        div.className = "chart"
        $("#charts").append(div);
        return div.id
    }


function createOverviewCharts() {
    var len = series.heap.length;

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Used heap",
            unit: "MB",
            data: series.heap
        }, {
            name: "Total GC CPU utilization",
            unit: "%",
            data: series.total_cpu_pct
        }
    );

    createSingleAxisChart(createContainer(), len * resolution, "CPU Utilization", "%",
        [{
            name: "Young Gen collections",
            unit: "%",
            data: series.cpu_pct
        }, {
            name: "Old Gen collections",
            unit: "%",
            data: series.old_cpu_pct
        }],
        "GC CPU Utilization - Young Gen vs. Old Gen"
    );

    createSingleAxisChart(createContainer(), len * resolution, "Number of collections per minute", "",
        [{
            name: "Young gen",
            unit: "",
            data: series.collections
        }, {
            name: "Old gen",
            unit: "",
            data: series.old_collections
        }],
        "Number of collections per minute - Young gen vs. Old gen"
    );

    createSingleAxisChart(createContainer(), len * resolution, "Memory", "MB",
         [{
             name: "Allocated memory per second",
             unit: "MB",
             data: series.allocated
         }, {
             name: "Promoted memory per second",
             unit: "MB",
             data: series.promoted
         }]
     );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Allocated memory per second",
            unit: "MB",
            data: series.allocated
        }, {
            name: "Total GC CPU utilization",
            unit: "%",
            data: series.total_cpu_pct
        }
    );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Promoted memory per second",
            unit: "MB",
            data: series.promoted
        }, {
            name: "Total GC CPU utilization",
            unit: "%",
            data: series.total_cpu_pct
        }
    );

    /*
    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Used heap",
            unit: "MB",
            data: series.heap
        }, {
            name: "Total GC CPU Time",
            unit: "s",
            data: series.total_cpu
        }
    );
    */





}

function createYoungGenCharts() {
    var len = series.heap.length;

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Allocated memory per second",
            unit: "MB",
            data: series.allocated
        }, {
            name: "Young Gen CPU utilization",
            unit: "%",
            data: series.cpu_pct
        }
    );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Promoted memory per second",
            unit: "MB",
            data: series.promoted
        }, {
            name: "Young Gen CPU utilization",
            unit: "%",
            data: series.cpu_pct
        }
    );

    createSingleAxisChart(createContainer(), len * resolution, "Memory", "MB",
        [{
            name: "Allocated memory per second",
            unit: "MB",
            data: series.allocated
        }, {
            name: "Promoted memory per second",
            unit: "MB",
            data: series.promoted
        }]
    );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Promoted memory per second",
            unit: "MB",
            data: series.promoted
        }, {
            name: "Promotion rate in percent",
            unit: "%",
            data: series.promoted_pct
        }
    );


    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "GC wall clock time per second",
            unit: "s",
            data: series.real
        }, {
            name: "GC CPU time per second",
            unit: "s",
            data: series.cpu
        }
    );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Average GC wall clock time",
            unit: "ms",
            data: series.real_avg
        }, {
            name: "Average GC CPU time",
            unit: "ms",
            data: series.cpu_avg
        }
    );

    /*
    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Used heap",
            unit: "MB",
            data: series.heap
        }, {
            name: "Collected garbage per second",
            unit: "MB",
            data: series.garbage
        }
    );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Used heap",
            unit: "MB",
            data: series.heap
        }, {
            name: "Promoted memory per second",
            unit: "MB",
            data: series.promoted
        }
    );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Allocated memory per second",
            unit: "MB",
            data: series.allocated
        }, {
            name: "GC wall clock time per second",
            unit: "s",
            data: series.real
        }
    );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "GC wall clock time per second",
            unit: "s",
            data: series.real
        }, {
            name: "GC CPU time per second",
            unit: "s",
            data: series.cpu
        }
    );
    */
}

function createOldGenCharts() {
    var len = series.heap.length;

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "Used heap",
            unit: "MB",
            data: series.heap
        }, {
            name: "Old gen GC CPU utilization",
            unit: "%",
            data: series.old_cpu_pct
        }
    );

    createSingleAxisChart(createContainer(), len * resolution, "Memory", "MB",
         [{
             name: "Promoted memory per second",
             unit: "MB",
             data: series.promoted
         }, {
             name: "Collected old memory per second",
             unit: "MB",
             data: series.garbage_old
         }]
     );

    createSingleAxisChart(createContainer(), len * resolution, "CPU Time per second", "s",
        [{
            name: "ParNewGen",
            data: series.cpu
        }, {
            name: "CMS Initial Mark",
            data: series.initmark_cpu
        }, {
            name: "CMS Mark",
            data: series.mark_cpu
        }, {
            name: "CMS Preclean",
            data: series.preclean_cpu
        }, {
            name: "CMS Abortable Preclean",
            data: series.abortable_preclean_cpu
        }, {
            name: "CMS Remark",
            data: series.remark_cpu
        }, {
            name: "CMS Sweep",
            data: series.sweep_cpu
        }, {
            name: "CMS Reset",
            data: series.reset_cpu
        }],
        "Garbage Collection CPU Time per second"
    );

    createSingleAxisChart(createContainer(), len * resolution, "Wall clock time per second", "s",
        [{
            name: "ParNewGen",
            data: series.real
        }, {
            name: "CMS Initial Mark",
            data: series.initmark_real
        }, {
            name: "CMS Mark",
            data: series.mark_real
        }, {
            name: "CMS Preclean",
            data: series.preclean_real
        }, {
            name: "CMS Abortable Preclean",
            data: series.abortable_preclean_real
        }, {
            name: "CMS Remark",
            data: series.remark_real
        }, {
            name: "CMS Sweep",
            data: series.sweep_real
        }, {
            name: "CMS Reset",
            data: series.reset_real
        }],
        "Garbage Collection Wall Clock Time per second"
    );

    /*
    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "CMS Mark wall clock time",
            unit: "s",
            data: series.mark_real
        }, {
            name: "CMS Mark CPU time",
            unit: "s",
            data: series.mark_cpu
        }
    );

    createDualAxisChart(createContainer(), len * resolution,
        {
            name: "CMS Sweep wall clock time",
            unit: "s",
            data: series.sweep_real
        }, {
            name: "CMS Sweep CPU time",
            unit: "s",
            data: series.sweep_cpu
        }
    );
    */

}

function createSingleAxisChart(id, duration, yName, yUnit, meta_series, title) {
    if(!title) {
        title = ""
        for(var i = 0; i < meta_series.length; i++) {
            if(i != 0) title += " vs. "
            title += meta_series[i].name
        }
    }
    chart_series = []
    for(var i = 0; i < meta_series.length; i++) {
        var s = meta_series[i];
        chart_series.push({
            name: s.name,
            pointInterval: resolution * 1000,
            type: 'spline',
            lineWidth: 2,
            marker: {
                radius: 2
            },
            data: s.data
        });
    }


    var chart = new Highcharts.Chart({
        chart: {
            renderTo: id,
            zoomType: 'x',
            borderWidth: 1
        },
        title: {
            text: title
        },
        plotOptions: {
            series: {
                animation: false
            }
        },
        xAxis: [{
            type: 'datetime'
        }],
        yAxis: [{ // Primary yAxis
            labels: {
                formatter: function() {
                    return this.value + ' ' + yUnit;
                }
            },
            title: {
                text: yName
            },
            min: 0
        }],
        tooltip: {
            formatter: function() {
                return Math.round(100 * this.y) / 100 + ' ' + yUnit;
            }
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            x: 100,
            verticalAlign: 'top',
            y: 50,
            floating: true,
            backgroundColor: '#FFFFFF'
        },
        series: chart_series
    });
}

function createDualAxisChart(id, duration, seriesA, seriesB) {
    var colorA = '#A74444'
    var colorB = '#4572A7'
    var chart = new Highcharts.Chart({
        chart: {
            renderTo: id,
            zoomType: 'x',
            borderWidth: 1
        },
        title: {
            text: seriesA.name + " vs. " + seriesB.name
        },
        plotOptions: {
            series: {
                animation: false
            }
        },
        xAxis: [{
            type: 'datetime'
        }],
        yAxis: [{ // Primary yAxis
            labels: {
                formatter: function() {
                    return this.value + ' ' + seriesA.unit;
                },
                style: {
                    color: colorA
                }
            },
            title: {
                text: seriesA.name,
                style: {
                    color: colorA
                }
            },
            min: 0
        }, { // Secondary yAxis
            title: {
                text: seriesB.name,
                style: {
                    color: colorB
                }
            },
            labels: {
                formatter: function() {
                    return this.value + ' ' + seriesB.unit;
                },
                style: {
                    color: colorB
                }
            },
            min: 0,
            opposite: true
        }],
        tooltip: {
            formatter: function() {
                return ''+
                    Math.round(100 * this.y) / 100 +
                    (this.series.name == seriesA.name ? ' ' + seriesA.unit : ' ' + seriesB.unit);
            }
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            x: 100,
            verticalAlign: 'top',
            y: 50,
            floating: true,
            backgroundColor: '#FFFFFF'
        },
        series: [{
            name: seriesA.name,
            color: colorA,
            pointInterval: resolution * 1000,
            type: 'spline',
            lineWidth: 2,
            marker: {
                radius: 2
            },
            data: seriesA.data
        },
        {
            name: seriesB.name,
            color: colorB,
            pointInterval: resolution * 1000,
            type: 'spline',
            lineWidth: 2,
            marker: {
                radius: 2
            },
            yAxis: 1,
            data: seriesB.data

        }]
    });
}
