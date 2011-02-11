var resolution = 60

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
            pointInterval: 60 * 1000,
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
            type: 'datetime',
            //maxZoom: duration * 1000
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
                return this.y + ' ' + yUnit;
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
            type: 'datetime',
            //maxZoom: duration * 1000
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
                    this.y +
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
            pointInterval: 60 * 1000,
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
            pointInterval: 60 * 1000,
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

function prepareSeries(list) {
    var young = list[0];
    var old = list[1];

    var heap = young[0]
    var collections = young[1]
    var garbage = young[2]
    var promoted = young[3]
    var allocated = []
    var cpu_ms = young[4]
    var real_ms = young[5]
    var cpu = []
    var cpu_pct = []
    var real = []
    var promoted_pct = []
    var cpu_avg = []
    var real_avg = []

    var len = heap.length;
    for(var i = 0; i < len; i++) {
        allocated.push(garbage[i] + promoted[i])
        cpu.push(cpu_ms[i] / 1000)
        cpu_pct.push(Math.round(100 * cpu_ms[i] / (1000 * resolution)))
        real.push(real_ms[i] / 1000)

        cpu_avg.push(Math.round(cpu_ms[i] / Math.max(1, collections[i])))
        real_avg.push(Math.round(real_ms[i] / Math.max(1, collections[i])))

        var fact = promoted[i] / Math.max(1, (promoted[i] + garbage[i]))
        promoted_pct.push(Math.round(10000 * fact) / 100)
    }

    var initmark_cpu = old[0]
    var initmark_real = old[1]
    var mark_cpu = old[2]
    var mark_real = old[3]
    var preclean_cpu = old[4]
    var preclean_real = old[5]
    var abortable_preclean_cpu = old[6]
    var abortable_preclean_real = old[7]
    var remark_cpu = old[8]
    var remark_real = old[9]
    var sweep_cpu = old[10]
    var sweep_real = old[11]
    var reset_cpu = old[12]
    var reset_real = old[13]
    var old_collections = old[14]
    var old_cpu = []
    var old_cpu_pct = []
    var total_cpu = []
    var total_cpu_pct = []

    len = mark_cpu.length;
    for(var i = 0; i < len; i++) {
        var old = initmark_cpu[i] + mark_cpu[i] + preclean_cpu[i] + abortable_preclean_cpu[i] + sweep_cpu[i] + remark_cpu[i] + reset_cpu[i]        
        old_cpu.push(Math.round(old))
        old_cpu_pct.push(Math.round(100 * old / resolution))
        var total = cpu[i] + old
        total_cpu.push(Math.round(total))
        total_cpu_pct.push(Math.round(100 * total / resolution))
    }

    var res = {}

    res.heap = heap
    res.collections = collections
    res.garbage = garbage
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

var series = {}

function createOverviewCharts() {
    document.getElementById("charts").innerHTML = ""

    var len = series.heap.length;

    createDualAxisChart(createContainer(), len * 60,
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

    createSingleAxisChart(createContainer(), len * 60, "CPU Utilization", "%",
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

    createSingleAxisChart(createContainer(), len * 60, "Number of collections per minute", "",
        [{
            name: "Young gen",
            unit: "",
            data: series.collections
        }, {
            name: "Old gen",
            unit: "",
            data: series.old_collections
        }],
        "Number of collections - Young gen vs. Old gen"
    );

    createSingleAxisChart(createContainer(), len * 60, "Memory", "MB",
         [{
             name: "Allocated memory per minute",
             unit: "MB",
             data: series.allocated
         }, {
             name: "Promoted memory per minute",
             unit: "MB",
             data: series.promoted
         }]
     );

    createDualAxisChart(createContainer(), len * 60,
        {
            name: "Allocated memory per minute",
            unit: "MB",
            data: series.allocated
        }, {
            name: "Total GC CPU utilization",
            unit: "%",
            data: series.total_cpu_pct
        }
    );

    createDualAxisChart(createContainer(), len * 60,
        {
            name: "Promoted memory per minute",
            unit: "MB",
            data: series.promoted
        }, {
            name: "Total GC CPU utilization",
            unit: "%",
            data: series.total_cpu_pct
        }
    );

    /*
    createDualAxisChart(createContainer(), len * 60,
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
    document.getElementById("charts").innerHTML = ""

    var len = series.heap.length;

    createDualAxisChart(createContainer(), len * 60,
        {
            name: "Allocated memory per minute",
            unit: "MB",
            data: series.allocated
        }, {
            name: "Young Gen CPU utilization",
            unit: "%",
            data: series.cpu_pct
        }
    );

    createDualAxisChart(createContainer(), len * 60,
        {
            name: "Promoted memory per minute",
            unit: "MB",
            data: series.promoted
        }, {
            name: "Young Gen CPU utilization",
            unit: "%",
            data: series.cpu_pct
        }
    );

    createSingleAxisChart(createContainer(), len * 60, "Memory", "MB",
        [{
            name: "Allocated memory per minute",
            unit: "MB",
            data: series.allocated
        }, {
            name: "Promoted memory per minute",
            unit: "MB",
            data: series.promoted
        }]
    );

    createDualAxisChart(createContainer(), len * 60,
        {
            name: "Promoted memory per minute",
            unit: "MB",
            data: series.promoted
        }, {
            name: "Promotion rate in percent",
            unit: "%",
            data: series.promoted_pct
        }
    );


    createDualAxisChart(createContainer(), len * 60,
        {
            name: "GC wall clock time per minute",
            unit: "s",
            data: series.real
        }, {
            name: "GC CPU time per minute",
            unit: "s",
            data: series.cpu
        }
    );

    createDualAxisChart(createContainer(), len * 60,
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
    createDualAxisChart(createContainer(), len * 60,
        {
            name: "Used heap",
            unit: "MB",
            data: series.heap
        }, {
            name: "Collected garbage per minute",
            unit: "MB",
            data: series.garbage
        }
    );

    createDualAxisChart(createContainer(), len * 60,
        {
            name: "Used heap",
            unit: "MB",
            data: series.heap
        }, {
            name: "Promoted memory per minute",
            unit: "MB",
            data: series.promoted
        }
    );

    createDualAxisChart(createContainer(), len * 60,
        {
            name: "Allocated memory per minute",
            unit: "MB",
            data: series.allocated
        }, {
            name: "GC wall clock time per minute",
            unit: "s",
            data: series.real
        }
    );

    createDualAxisChart(createContainer(), len * 60,
        {
            name: "GC wall clock time per minute",
            unit: "s",
            data: series.real
        }, {
            name: "GC CPU time per minute",
            unit: "s",
            data: series.cpu
        }
    );
    */
}

function createOldGenCharts() {
    document.getElementById("charts").innerHTML = ""

    var len = series.heap.length;

    createDualAxisChart(createContainer(), len * 60,
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

    createSingleAxisChart(createContainer(), len * 60, "CPU Time", "s",
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
        "Garbage Collection CPU Time"
    );

    createSingleAxisChart(createContainer(), len * 60, "Wall clock time", "s",
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
        "Garbage Collection Wall Clock Time"
    );

    /*
    createDualAxisChart(createContainer(), len * 60,
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

    createDualAxisChart(createContainer(), len * 60,
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
