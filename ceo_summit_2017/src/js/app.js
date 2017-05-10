import 'babel-polyfill';
import $ from 'jquery';
//import * as d3 from 'd3';

import Comment from '../templates/comment.handlebars';
import Speaker from '../templates/speaker.handlebars';
import TranscribedText from '../templates/transcribed_text.handlebars';

class Attendee {
  constructor() {

    this.AMP = null;

    this.commentIndex = 0;

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

    this.renderMediaPlayer();
    this.setTranscriptInventory();
    this.renderLanguageSelectionGroup();
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

  renderMediaPlayer() {
    let media = amp('video');

    media.src([{
      src: "https://msstream.streaming.mediaservices.windows.net/7e18fdf3-4978-4f51-ab41-2aeba9694c5d/CEO%20Town%20Hall.ism/manifest",
      type: "application/vnd.ms-sstr+xml"
    }]);

    media.on('timeupdate', () => {
      let time = media.currentTime();
      this.syncComments(time);
      this.syncTranscript(time);
    });

    this.AMP = media;
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

  setTranscriptInventory(language=this.languages.selected) {
    let texts = transcriptionLanguages[language.toLowerCase()];
    this.transcript.inventory = texts.map((text) => {
      return text.end.split('.')[0];
    });
  }

  // TODO: Abstract these two...
  syncComments(time) {
    let target = comments[this.commentIndex];

    if (!target) return;

    let millisecondMark = 0;
    let [minutes, seconds] = target.timeString.split(':');
    minutes = parseInt(minutes);
    seconds = parseInt(seconds);

    if (minutes > 0) { seconds += (60 * minutes); }

    millisecondMark = seconds * 1000;

    if (millisecondMark <= time * 1000) {
      let commentNode = Comment(target);
      let $c = $(commentNode);

      this.DOM.yammerComments.content.prepend($c);

      setTimeout(() => { $c.addClass('visible'); }, 100);
      this.commentIndex++;
    }
  }

  syncTranscript(time) {
    let target = this.transcript.inventory[this.transcript.index];

    if (!target) return;

    let millisecondMark = 0;
    let [, minutes, seconds] = target.split(':');
    minutes = parseInt(minutes);
    seconds = parseInt(seconds);

    if (minutes > 0) { seconds += (60 * minutes); }

    millisecondMark = seconds * 1000;

    if (millisecondMark <= time * 1000) {
      let text = transcriptionLanguages[this.languages.selected.toLowerCase()][this.transcript.index];

      if (text.text.length > 0) {
        let [,m,s] = text.start.split('.')[0].split(':');

        let textNode = TranscribedText({
          text: text.text,
          timeString: `${m}:${s}`
        });
        let $t = $(textNode);

        this.DOM.transcriptionTimeline.content.append($t);
        setTimeout(() => {
          $t.addClass('visible');
          this.DOM.transcriptionTimeline.content[0].scrollTop = this.DOM.transcriptionTimeline.content[0].scrollHeight;
        }, 100);
      }

      this.transcript.index++;
    }
  }
}

class Analytic {
  constructor() {

    this.AMP = null;

    this.charts = {
      engagement: null,
      speaker: null,
      viewers: null
    }

    this.DOM = {
      clickableViz: $('.clickable-viz'),
      vizFilter: $('.viz-filter')
    };
  }

  init() {
    this.renderMediaPlayer();
    this.renderEngagement();
    this.renderActiveSpeakers();
    this.renderRetention();

    this.DOM.vizFilter.mouseout((e) => {
      let filter = $(e.delegateTarget).data().filter;
      $(`.c3-legend-item-${filter}`).d3mouseout();
    });

    this.DOM.vizFilter.mouseover((e) => {
      let filter = $(e.delegateTarget).data().filter;
      $(`.c3-legend-item-${filter}`).d3mouseover();
    });

    this.DOM.vizFilter.click((e) => {
      let filter = $(e.delegateTarget).data().filter;
      $(`.c3-legend-item-${filter}`).d3click();
      $(e.delegateTarget).toggleClass('active');
    });

    this.DOM.clickableViz.click((e) => {
      let leftOffset = 60;
      if (e.offsetX < leftOffset) return;

      let adjustedLeft = e.offsetX - leftOffset;
      let paddingConst = 28;

      let domain = $(e.delegateTarget).innerWidth() - leftOffset - paddingConst;

      let percent = adjustedLeft / domain;
      let time = ~~(this.AMP.duration() * percent);

      console.log(adjustedLeft, domain, percent, time);

      this.AMP.currentTime(time);
    });

    $(window).on('resize', () => {
      this.charts.engagement.resize({
        height: this.getChartHeight($('.container-right .top'), $('#viz_filter'))
      });

      this.charts.viewers.resize({
        height: this.getChartHeight($('.container-left .bottom'), $('.container-left .bottom h2'), 0)
      });
    });
  }

  getChartHeight($parent, $neg, slop=10) {
    let height = $parent.innerHeight();
    let negativeHeight = !!$neg ?
      $neg.position().top + $neg.outerHeight() :
      0;

    return height - (negativeHeight - slop);
  }

  renderActiveSpeakers() {
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

    this.charts.speaker = $('#viz_speakers');

    $('#viz_speakers').append('<div id="timeline_scrubber"></div>');
  }

  renderEngagement() {
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
        columns: sentiment,
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
        left: 60,
        right: 20
      },
      size: {
        height: this.getChartHeight($('.container-right .top'), $('#viz_filter'))
      },
      tooltip: {
        format: {
          name: (name, ratio, id, i) => {
            return name;
          },
          title: (x) => {
            return `Sentiment at ${sentiment[0][x]}`
          },
          value: (value, ratio, id, i) => {
            return value.toFixed(0);
          }
        }
      }
    });

    this.charts.engagement = chart;
  }

  renderMediaPlayer() {
    let media = amp('video', {
      autoplay: false
    });

    media.src([{
      src: "https://msstream.streaming.mediaservices.windows.net/7e18fdf3-4978-4f51-ab41-2aeba9694c5d/CEO%20Town%20Hall.ism/manifest",
      type: "application/vnd.ms-sstr+xml"
    }]);

    media.on('timeupdate', () => {
      let duration = media.duration();
      let time = media.currentTime();
      this.syncPlayheads(duration, time);
    });

    this.AMP = media;
  }

  renderRetention() {
    let chart = c3.generate({
      axis: {
        x: {
          tick: {
            count: 10
          },
          type: 'category'
        }
      },
      bindto: '#viz_retention',
      data: {
        colors: {
          'active viewers': '#b9fd75'
        },
        columns: retention,
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
        bottom: 20,
        left: 60,
        right: 20
      },
      size: {
        height: this.getChartHeight($('.container-left .bottom'), $('.container-left .bottom h2'), 0)
      },
      tooltip: {
        format: {
          name: (name, ratio, id, i) => {
            return name;
          },
          title: (x) => {
            return `Active Viewers at ${retention[0][x]}`
          },
          value: (value, ratio, id, i) => {
            return value.toFixed(0);
          }
        }
      }
    });

    this.charts.viewers = chart;
  }

  syncPlayheads(duration, time) {
    let leftOffset = 60;
    let paddingConst = 28;

    $('.playhead').each((i, el) => {
      let domain = $(el).parent().innerWidth() - leftOffset - paddingConst;
      let percentComplete = time/duration;
      let position = (domain * percentComplete) + leftOffset;
      $(el).css('left', position);
    });
  }
}

// Remeber no fat arrow
['click', 'mouseout', 'mouseover'].forEach(function(event) {
  $.fn[`d3${event}`] = function () {
    this.each(function (i, e) {
      var evt = new MouseEvent(event);
      e.dispatchEvent(evt);
    });
  };
});

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
