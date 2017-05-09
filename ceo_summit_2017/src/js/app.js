import 'babel-polyfill';
import $ from 'jquery';
//import * as d3 from 'd3';

import Comment from '../templates/comment.handlebars';
import Speaker from '../templates/speaker.handlebars';
import TranscribedText from '../templates/transcribed_text.handlebars';

class Attendee {
  constructor() {
    this.DOM = {
      iframeVideo: $('#iframe_video'),
      languageSelect: {
        confirm: $('#language_select_confirm'),
        search: $('#language_selection_search'),
        selectionGroup: $('#language_selection_group'),
        trigger: $('.language-select-trigger'),
      },
      tabLink: $('.tab-link'),
      transcriptionTimeline: {
        _self: $('#transcription_timeline'),
        content: $('#transcription_timeline .tab-content-content')
      },
      yammerComments: {
        _self: $('#yammer_comments'),
        content: $('#yammer_comments .tab-content-content')
      }
    };

    this.inIframe = false;

    this.languages = {
      options: [
        'Chinese',
        'English',
        'French',
        'German',
        'Italian',
        'Japanese',
        'Portuguese',
        'Russian',
        'Spanish'
      ],
      selected: 'English'
    };

    this.slideUp = {
      active: false,
      target: $('#language_select')
    };

    this.timer = {
      _self: null,
      active: false,
      rate: 16,
      report: 0,
      time: 0
    };

    this.transcript = {
      index: 0,
      inventory: []
    };

    this.TRANSITION = 333;
  }

  handleLanguageConfirm() {
    this.languages.selected = this
      .DOM
      .languageSelect
      .selectionGroup
      .find('.active')
      .text();
    this.renderTranscriptionText();

    return this;
  }

  handleLanguageSearch(e) {
    let query = this.DOM.languageSelect.search.val();
    let filteredOptions = this.languages.options.filter((option) => {
      return option.toLowerCase().startsWith(query.toLowerCase());
    });

    this.renderLanguageSelectionGroup(filteredOptions);
  }

  handleLanguagePreSelect(e) {
    this
      .DOM
      .languageSelect
      .selectionGroup
      .find('.active')
      .removeClass('active');

    $(e.target).addClass('active');

    return this;
  }

  handleToggleSlideUp() {
    if (!this.slideUp.active) {
      this.DOM.languageSelect.search.val('');
      this.renderLanguageSelectionGroup();
      setTimeout(() => {
        this.DOM.languageSelect.search.focus();
      }, this.TRANSITION);
    }

    this.slideUp.active = !this.slideUp.active;
    this.slideUp.target.toggleClass('active', this.slideUp.active);

    return this;
  }

  init() {
    this.DOM.languageSelect.confirm.click(() => {
      this
        .handleLanguageConfirm()
        .handleToggleSlideUp();
    });

    this.DOM.languageSelect.search.on('keyup', (e) => {
      this.handleLanguageSearch(e);
    });

    this.DOM.languageSelect.trigger.click(() => {
      this.handleToggleSlideUp();
    });

    this.DOM.tabLink.click((e) => {
      let $target = $(e.delegateTarget);

      $('.tab-link.active').removeClass('active');
      $('.tab-content-container.active').removeClass('active');

      $target.addClass('active');
      $(`#${$target.data().tab}`).addClass('active');
    });

    $(window).on('blur', () => {
      if (this.inIframe) {
        if (this.timer.active) { this.stopTimeSync(); }
        else { this.startTimeSync(); }
      }
    });

    this.DOM.iframeVideo
      .on('load', (e) => { this.startTimeSync(); })
      .on('mouseover', () => { this.inIframe = true; })
      .on('mouseout', () => { this.inIframe = false; });

    this.setTranscriptInventory();
    this.renderLanguageSelectionGroup();
    this.renderTranscriptionText();
    this.renderYammerComments();
  }

  renderLanguageSelectionGroup(options=this.languages.options) {
    this.DOM.languageSelect.selectionGroup.empty();

    for (let option of options) {
      let activeClass = option === this.languages.selected ?
        'active' :
        '';
      this.DOM.languageSelect.selectionGroup
        .append(`<li class='${activeClass}'>${option}</li>`);
    }

    this.DOM.languageSelect.selectionGroup.find('li')
      .click((e) => this.handleLanguagePreSelect(e));
  }

  renderTranscriptionText(language=this.languages.selected) {
    this.DOM.transcriptionTimeline.content.empty();

    let texts = transcriptionLanguages[language.toLowerCase()];

    for (let i = 0; i <= this.transcript.index - 1; ++i) {
      let text = texts[i];
      if (text.text.length > 0) {
        let textNode = TranscribedText({
          text: text.text,
          timeString: text.start.split('.')[0]
        });

        let $t = $(textNode).addClass('visible');
        this.DOM.transcriptionTimeline.content.append($t);
      }
    }
  }

  renderYammerComments() {
    let comment = Comment({
      avatarSrc: 'https://randomuser.me/api/portraits/men/5.jpg',
      name: 'Guy Userman',
      comment: 'Bacon ipsum dolor amet pancetta alcatra capicola brisket pork salami meatloaf hamburger pastrami flank kevin prosciutto andouille landjaeger cow. Chuck leberkas ham tail shank tongue.',
      timeString: '12:34'
    });

    for (let i = 0; i < 25; ++i) {
      this.DOM.yammerComments.content.append(comment);
    }
  }

  setTranscriptInventory(language=this.languages.selected) {
    let texts = transcriptionLanguages[language.toLowerCase()];
    this.transcript.inventory = texts.map((text) => {
      return text.start.split('.')[0];
    });
  }

  startTimeSync() {
    clearInterval(this.timer._self);
    this.timer._self = setInterval(() => {
      $(window).focus();
      this.timer.time += this.timer.rate;
      if (this.timer.report === 60) {
        this.syncTranscript();
        this.timer.report = 0;
      }
      this.timer.report++;
    }, this.timer.rate);
    this.timer.active = true;
  }

  stopTimeSync() {
    clearInterval(this.timer._self);
    this.timer.active = false;
    this.timer._self = setInterval(() => {
      $(window).focus();
    }, this.timer.rate);
  }

  syncTranscript() {
    let target = this.transcript.inventory[this.transcript.index];
    let millisecondMark = 0;
    let [, minutes, seconds] = target.split(':');
    minutes = parseInt(minutes);
    seconds = parseInt(seconds);

    if (minutes > 0) { seconds += (60 * minutes); }

    millisecondMark = seconds * 1000;

    if (millisecondMark <= this.timer.time) {
      let text = transcriptionLanguages[this.languages.selected.toLowerCase()][this.transcript.index];

      let textNode = TranscribedText({
        text: text.text,
        timeString: text.start.split('.')[0]
      });
      let $t = $(textNode);

      this.DOM.transcriptionTimeline.content.append($t);
      setTimeout(() => {
        $t.addClass('visible');
        this.DOM.transcriptionTimeline.content[0].scrollTop = this.DOM.transcriptionTimeline.content[0].scrollHeight;
      }, 100);
      this.transcript.index++;
    }
  }
}

class Analytic {
  constructor() {}

  init() {
    this.renderLineGraph();
    this.renderTimeline();
  }

  renderLineGraph() {
    // [angry, applause, dislike, like, happy]
    let dataFactory = () => {
      let seconds = -1;
      let minutes = 0;
      let f = (t) => { return t < 10 ? `0${t}` : t; };
      let r = (max) => { return ~~(Math.random() * max)};
      let lastStep = [0,0,0,0,0];
      let factor = 30;
      let base = 1000;
      let generateStep = () => {
        let newStep = lastStep.map((value, i) => {
          let halfEnvelope = base * ((1/factor)/2);
          let max = Math.min(1 * base, value + halfEnvelope);
          let min = Math.max(0, value - halfEnvelope);

          return (i === 0 || i === 2) ?
            (Math.random() > .85) ?
              0 :
              (Math.random()*(max-min)+min) :
            (Math.random() > .85) ?
              0 :
              (Math.random()*(max-min)+min);
        });
        lastStep = newStep;
        return newStep;
      };

      let returnData = [
        ['x'],
        ['angry'],
        ['applause'],
        ['dislike'],
        ['like'],
        ['love']
      ];

      for (let i = 0; i < 91; ++i) {
        seconds++;
        if (seconds > 59) { minutes++; seconds = 0; }

        generateStep().forEach((data, index) => {
          returnData[index+1].push(data);
        });
      }

      let secondStep = 10;
      seconds = -10;
      minutes = 0;
      for (let i = 0; i < 91; ++i) {
        seconds += secondStep;
        if (seconds > 59) { minutes++; seconds = 0; }
        let m = minutes < 10 ? `0${minutes}` : minutes;
        let s = seconds < 10 ? `0${seconds}` : seconds;
        returnData[0].push(`${m}:${s}`);
      }

      return returnData;
    };

    let height = $('.container-right .top').innerHeight();
    let data = dataFactory();
    let chart = c3.generate({
      axis: {
        x: {
          tick: {
            count: 10
          },
          type: 'category'
        }
      },
      bindto: '#viz_engagement',
      data: {
        colors: {
          angry: '#FDB813',
          applause: '#b9fd75',
          dislike: '#FF8C00',
          like: '#575DA9',
          love: '#EC028C',
        },
        columns: data,
        groups: [['angry', 'applause', 'dislike', 'happy', 'love']],
        type: 'bar',
        x: 'x'
      },
      onmouseout: () => {
        $(window).off('mousemove');
        $('#timeline_scrubber').removeClass('active');
      },
      onmouseover: () => {
        let leftOffset = $('#viz_engagement').offset().left;
        $(window).on('mousemove', (e) => {
          let left = (e.offsetX < 50) ? 50 : e.offsetX;
          $('#timeline_scrubber').css('left', left);
          $('#timeline_scrubber').toggleClass('active', $('.c3-tooltip-container').is(':visible'));
        });
      },
      padding: {
        left: 50,
        right: 20
      },
      size: {
        height: height
      },
      tooltip: {
        format: {
          name: (name, ratio, id, i) => {
            return name;
          },
          title: (x) => {
            return `Sentiment at ${data[0][x]}`
          },
          value: (value, ratio, id, i) => {
            return value.toFixed(0);
          }
        }
      }
    });

    $(window).on('resize', () => {
      let height = $('.container-right .top').innerHeight();
      chart.resize({height});
    });
  }

  renderTimeline() {
    let width = $('.container-right .top').innerWidth() - 70;

    let speakers = [
      {
        avatarSrc: '../images/satya.png',
        blocks: [
          {
            duration: width * .66,
            start: 0
          },
          {
            duration: width * .1,
            start: width * .9
          }
        ],
        name: 'Satya Nadella'
      },
      {
        avatarSrc: '../images/amy.png',
        blocks: [
          {
            duration: width * .14,
            start: width * .66
          }
        ],
        name: 'Amy Hood'
      },
      {
        avatarSrc: '../images/chris.png',
        blocks: [
          {
            duration: width * .1,
            start: width * .8
          }
        ],
        name: 'Chris Capossela'
      }
    ];

    for (let speaker of speakers) {
      $('#viz_speakers').append(Speaker(speaker));
    }

    $('#viz_speakers').append('<div id="timeline_scrubber"></div>')

  }

}

$(document).ready(() => {
  if ($('body.attendee-view').length) {
    let attendeeView = new Attendee();
    attendeeView.init();
  }
  if ($('body.analytics-view').length) {
    let analyticsView = new Analytic();
    analyticsView.init();
  }
});
