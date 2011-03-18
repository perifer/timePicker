function equalsDate(d1, d2, message) {
  if (!d1 || !d2) {
    ok(false, message + ' - missing date');
    return;
  }
  d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  equals(d1.toString(), d2.toString(), message);
}

module("timePicker");

test('formatTime', function() {
  equals($.timePicker.formatTime('HH:mm', new Date(0, 0, 0, 13, 30)),
    '13:30', 'Format time HH:mm');
  equals($.timePicker.formatTime('HH:mm tt', new Date(2022, 0, 0, 13, 30)),
    '13:30 PM', 'Format time HH:mm');
  equals($.timePicker.formatTime('hh:mm tt', new Date(2022, 0, 0, 13, 30)),
    '01:30 PM', 'Format time hh:mm tt');
  equals($.timePicker.formatTime('h:mm t', new Date(2022, 0, 0, 4, 30)),
    '4:30 A', 'Format time h:m t');
  equals($.timePicker.formatTime('hh:mm tt', new Date(2022, 0, 0, 0, 0)),
    '12:00 AM', 'Format time hh:mm tt');
  equals($.timePicker.formatTime('h:m t', new Date(2022, 0, 0, 0, 0)),
    '12:0 A', 'Format time h:m t');
});

test('parseTime', function() {
  equalsDate($.timePicker.parseTime('HH:mm', '13:30'),
    new Date(2001,0,0,13,30,0), 'Format time HH:mm');
  equalsDate($.timePicker.parseTime('h:m', '2:1'),
    new Date(2001,0,0,2,1,0), 'Format time h:m');
  equalsDate($.timePicker.parseTime('hh:mm tt', '12:00 AM'),
    new Date(2001,0,0,0,0,0), 'Format time hh:mm tt midnight');
});
