var units  = ['b', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
var rates  = ['b/s', 'KiB/s', 'MiB/s', 'GiB/s', 'TiB/s', 'PiB/s'];
var shortrates  = ['b', 'K', 'M', 'G', 'T', 'P'];
var batpic = ["→", "↓", "↑"];

var cluster = {
    'disks': {
        'read': 0,
        'write': 0,
        'iops': 0,
    },
};

var color;
var root;

function percentstyle(percent) {
    return 'color: black;';
}

function percentvalue(value, total) {
    if(total == 0)
        return 0;

    return parseFloat(Math.floor((value / total) * 100));
}

function colorizesw(value, size) {
    if(value < 10)
        return {'class': 'text-muted'};

    if(value < 2)
        return {'class': 'text-muted'};

    if(value < 30)
        return {'class': 'text-info'};

    return colorize(value);
}

function colorize(value) {
    if(value < 8)
        return {'class': 'text-muted'};

    if(value < 18)
        return {'class': ''};

    if(value < 50)
        return {'class': 'text-info'};

    if(value < 80)
        return {'class': 'text-warning'};

    return {'class': 'text-danger'};
}

function loadcolor(value, cpu) {
    if(value < 0.8)
        return {'class': 'text-muted'};

    if(value < 1.5)
        return {'class': ''};

    if(value < cpu / 4)
        return {'class': 'text-info'};

    if(value < cpu)
        return {'class': 'text-warning'};

    return {'class': 'text-danger'};
}

function autosize(value) {
    var temp = value / 1024;
    var unitidx = 2;

    if(temp > 4096) {
        temp /= 1024;
        unitidx = 3;
    }

    return temp.toFixed(2) + ' ' + units[unitidx];
}

//
// return a value prefixed by zero if < 10
//
function zerolead(value) {
    return (value < 10) ? '0' + value : value;
}

//
// convert a unix timestamp to readable european date/hours
//
function unixtime(timestamp) {
    var date = new Date(timestamp * 1000);

    var hours = zerolead(date.getHours()) + ':' +
                zerolead(date.getMinutes()) + ':' +
                zerolead(date.getSeconds());

    return hours;
}

function bytestomb(value) {
    return (value / (1024 * 1024)).toFixed(2);
}

//
// compute a scaled size with adapted prefix
//
function size(value, total) {
    uindex = 1;

    pc = Math.floor((value / total) * 100);

    for(; value > 1024; value /= 1024)
        uindex++;

    text = value.toFixed(2) + ' ' + units[uindex] + (total ? ' (' + pc + ' %)' : '');

    return $('<span>', {style: percentstyle(pc)}).html(text);
}

function streamsize(value) {
    uindex = 0;

    for(; value > 1024; value /= 1024)
        uindex++;

    text = value.toFixed(2) + ' ' + units[uindex];

    pc = ((uindex / rates.length) * 100);

    return $('<span>', {style: percentstyle(pc)}).html(text);
}

function rate(value) {
    value = value / 1024;
    uindex = 1;

    for(; value > 1024; value /= 1024)
        uindex++;

    return value.toFixed(2) + ' ' + rates[uindex];
}

function shortrate(value) {
    value = value / 1024;
    uindex = 1;

    for(; value > 1024; value /= 1024)
        uindex++;

    return value.toFixed(2) + ' ' + shortrates[uindex];
}

function colorintf(value, maxspeed) {
    var value = value / 1024 / 1024; // let's compute everything in Mbps

    // compute color based on interface speed/capacity
    // if scale is unknown, setting it to 100 Mbps
    if(maxspeed == 0)
        scale = 100;

    // computing percentage of usage
    var pc = (value / maxspeed) * 100;

    if(value < 5)
        return {'class': ''};

    if(value < 40)
        return {'class': 'text-info'};

    if(value < 60)
        return {'class': 'text-warning'};

    return {'class': 'text-danger'};
}

function colordisk(value) {
    // using MB/s
    value = value / 1024 / 1024;

    if(value < 1.2)
        return {'class': ''};

    if(value < 20)
        return {'class': 'text-info'};

    if(value < 100)
        return {'class': 'text-warning'};

    return {'class': 'text-danger'};
}

function colorbattery(battery) {
    if(battery.load == -1)
        return {'class': 'text-muted'};

    return {'class': ''};
}

function colorcputemp(text, value) {
    if(value == 0)
        return $('<span>', {'class': 'text-muted'}).html(text);

    if(value < 45)
        return $('<span>', {'class': 'text-muted'}).html(text);

    if(value < 55)
        return $('<span>', {'class': ''}).html(text);

    if(value < 65)
        return $('<span>', {'class': 'text-warning'}).html(text);

    return $('<span>', {'class': 'text-danger'}).html(text);
}

function colorhddtemp(text, value) {
    if(value == 0)
        return $('<span>', {'class': 'text-muted'}).html(text);

    if(value < 35)
        return $('<span>', {'class': 'text-muted'}).html(text);

    if(value < 45)
        return $('<span>', {'class': ''}).html(text);

    if(value < 50)
        return $('<span>', {'class': 'text-warning'}).html(text);

    return $('<span>', {'class': 'text-danger'}).html(text);
}

//
// compute an uptime (days or hours supported)
//
function uptime(value) {
    if((days = value / 86400) > 1)
        return Math.floor(days) + ' days';

    return Math.floor(value / 3600) + ' hours';
}

//
// return a celcius degree if exists
//
function degree(value, limit) {
    if(!value)
        return '<small>-</small>';

    return value + '°C';
}

//
// return formated percent format with different colors
// scaled with value. optional output text can be used
// percentage is padded to have fixed length
//
function percent(value, extra) {
    return value + ' %' + ((extra) ? ' (' + extra + ')' : '');
}

//
// parsing battery rtinfo object
//
function battery(battery) {
    var bat = '';

    if(battery.load == -1)
        return '<small>[AC]</small>';

    if(batpic[battery.status] != undefined)
        bat = batpic[battery.status] + ' ';

    var pc = battery.load;
    if(battery.load < 0 || battery.load > 100)
        pc = 100;

    return bat + percent(pc);
}

//
// build a 'summary' table node line
//
function summary_node(node, server) {
    var status = {'class': ''};

    if(node.lasttime + 30 < server.servertime)
        status['class'] = 'node-down';

    var tr = $('<tr>', status);

    var status = 'text-success';
    if(node.lasttime + 5 < server.servertime)
        status = 'text-warning';

    if(node.lasttime + 30 < server.servertime)
        status = 'text-danger';

    var hostname = $('<a>', {
        'data-toggle': "tooltip",
        'data-placement': "top",
        'title': new Date(node.lasttime * 1000),
        'href': '#',
        'class': status,

    }).tooltip().html(node.hostname);

    tr.append($('<td>', {'class': status}).append(hostname));

    var swap = 0;
    if(node.memory.swap_total > 0)
        swap = node.memory.swap_total - node.memory.swap_free;

    for(var index in node.loadavg)
        node.loadavg[index] = parseFloat(node.loadavg[index]).toFixed(2);

    var cpunr = node.cpu_usage.length - 1;
    var ram   = percentvalue(node.memory.ram_used, node.memory.ram_total);
    var swap  = node.memory.swap_total - node.memory.swap_free;
    var pswap = percentvalue(swap, node.memory.swap_total);

    tr.append($('<td>', colorize(node.cpu_usage[0]))
        .html(percent(node.cpu_usage[0])));

    tr.append($('<td>').html(cpunr));

    var size = autosize(node.memory.ram_used);
    tr.append($('<td>', colorize(ram)).html(percent(ram, size)));

    /*
    var size = autosize(swap);
    if(node.memory.swap_total > 0)
        tr.append($('<td>', colorizesw(pswap, swap)).html(percent(pswap, size)));

    else tr.append($('<td>').html('-'));
    */

    tr.append($('<td>', loadcolor(node.loadavg[0], cpunr)).html(node.loadavg[0]));
    tr.append($('<td>', loadcolor(node.loadavg[1], cpunr)).html(node.loadavg[1]));
    tr.append($('<td>', loadcolor(node.loadavg[2], cpunr)).html(node.loadavg[2]));
    // tr.append($('<td>').html(node.remoteip));
    tr.append($('<td>').html(unixtime(node.time)));

    var up = uptime(node.uptime);
    tr.append($('<td>').html(up));

    /*
    var bat = battery(node.battery);
    tr.append($('<td>', colorbattery(node.battery)).html(bat));

    tr.append($('<td>').html(colorcputemp(degree(node.sensors.cpu.average), node.sensors.cpu.average)));
    tr.append($('<td>').html(colorhddtemp(degree(node.sensors.hdd.average), node.sensors.hdd.average)));
    */

    // disk usage
    var speed = 0
    for(var idx in node.disks) {
        cluster['disks']['read'] += node.disks[idx].read_speed;
        cluster['disks']['write'] += node.disks[idx].write_speed;

        speed += node.disks[idx].read_speed + node.disks[idx].write_speed;
    }

    tr.append($('<td>', colordisk(speed)).html(rate(speed)));

    var iops = ((speed / 1024 / 1024) / 4) * 1024;
    tr.append($('<td>').html(iops.toLocaleString()));

    cluster['disks']['iops'] += iops;

    // network usage (rx)
    var speed = 0
    for(var idx in node.network)
        speed += node.network[idx].rx_rate;

    tr.append($('<td>', colorintf(speed, 1000)).html(rate(speed)));

    // network usage (tx)
    var speed = 0
    for(var idx in node.network)
        speed += node.network[idx].tx_rate;

    tr.append($('<td>', colorintf(speed, 1000)).html(rate(speed)));

    return tr;
}


//
// build summary table
//
function summary(host, server, nodes) {
    $('#summary-' + host).empty();
    $('#summary-' + host).css('display', '');

    cluster['disks']['read'] = 0;
    cluster['disks']['write'] = 0;
    cluster['disks']['iops'] = 0;

    var thead = $('<thead>')
        .append($('<td>', {'class': 'td-8'}).html('Hostname'))
        .append($('<td>', {'class': 'td-3'}).html('CPU'))
        .append($('<td>', {'class': 'td-2'}).html('#'))
        .append($('<td>', {'class': 'td-10'}).html('RAM'))
        // .append($('<td>', {'class': 'td-10'}).html('SWAP'))
        .append($('<td>', {'colspan': 3, 'class': 'td-10'}).html('Load Average'))
        // .append($('<td>', {'class': 'td-8'}).html('Remote IP'))
        .append($('<td>', {'class': 'td-5'}).html('Time'))
        .append($('<td>', {'class': 'td-5'}).html('Uptime'))
        // .append($('<td>', {'class': 'td-5'}).html('Battery'))
        // .append($('<td>', {'class': 'td-4'}).html('CPU'))
        // .append($('<td>', {'class': 'td-4'}).html('Disk'))
        .append($('<td>', {'class': 'td-8'}).html('Disks I/O'))
        .append($('<td>', {'class': 'td-8'}).html('Disk IOPS'))
        .append($('<td>', {'class': 'td-8'}).html('Net RX'))
        .append($('<td>', {'class': 'td-8'}).html('Net TX'));

    $('#summary-' + host).append(thead);
    $('#summary-' + host).append($('<tbody>'));

    for(var n in nodes)
        $('#summary-' + host + ' tbody').append(summary_node(nodes[n], server));

    $('#disk-read .value').html(bytestomb(cluster['disks']['read']));
    $('#disk-write .value').html(bytestomb(cluster['disks']['write']));
    $('#disk-iops .value').html(cluster['disks']['iops'].toLocaleString());
}

//
// parsing new json tree and call required display process
//
function parsing(response, host) {
    // console.log(response);
    var json = response;

    // clearing everyting
    $('body').attr('class', 'connected');

    //
    // ordering hostname
    //
    var hosts = [];
    var nodes = [];

    for(var x in json.rtinfo)
        hosts.push(json.rtinfo[x].hostname);

    hosts = hosts.sort();

    for(var n in hosts)
        for(var x in json.rtinfo)
            if(json.rtinfo[x].hostname == hosts[n])
                nodes.push(json.rtinfo[x]);

    // console.log(nodes);

    //
    // iterate over differents part showable/hiddable
    //
    summary(host, json, nodes);
}

function rtinfo_call(host) {
    // ensure this source exists
    if(!$('#root-' + host).length) {
        var root = $('<div>', {'id': 'root-' + host});
        root.append($('<table>', {'class': "table table-hover table-condensed", 'id': "summary-" + host}));

        $('#content').append(root);
    }
}

var socket;

function connect() {
    var host = window.location.host
    socket = new WebSocket("ws://" + host + "/ws");

    socket.onopen = function() {
        console.log("websocket open");
        $('#disconnected').hide();
    }

    socket.onmessage = function(msg) {
        json = JSON.parse(msg.data);
        console.log(json);

        switch(json['type']) {
            case "rtinfo":
                rtinfo_call("default");
                parsing(json['payload'], 'default');
            break;

            default:
                console.log("Unknown type");
                console.log(json);
        }
    }

    socket.onclose = function() {
        $('#disconnected').show();
        setTimeout(connect, 2000);
    }
}

$(document).ready(function() {
    connect();
});
