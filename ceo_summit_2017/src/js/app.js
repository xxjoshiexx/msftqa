import "babel-polyfill";
import $ from "jquery";
import * as d3 from "d3";

import Comment from "../templates/comment.handlebars"
import TranscribedText from "../templates/transcribed_text.handlebars"

class Attendee {
  constructor() {
    this.DOM = {
      iframeVideo: $('#iframe_video'),
      languageSelect: {
        confirm: $('#language_select_confirm'),
        search: $('#language_selection_search'),
        selectionGroup: $('#language_selection_group'),
        trigger: $('.language-select-trigger')
      },
      transcriptionTimeline: $('#transcription_timeline')
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
  }

  renderLanguageSelectionGroup(options=this.languages.options) {
    this.DOM.languageSelect.selectionGroup.empty();

    for (let option of options) {
      let activeClass = option === this.languages.selected ?
        'active' :
        '';
      this.DOM.languageSelect.selectionGroup
        .append(`<li class="${activeClass}">${option}</li>`);
    }

    this.DOM.languageSelect.selectionGroup.find('li')
      .click((e) => this.handleLanguagePreSelect(e));
  }

  renderTranscriptionText(language=this.languages.selected) {
    this.DOM.transcriptionTimeline.empty();

    let texts = transcriptionLanguages[language.toLowerCase()];

    for (let i = 0; i <= this.transcript.index - 1; ++i) {
      let text = texts[i];
      if (text.text.length > 0) {
        let textNode = TranscribedText({
          text: text.text,
          timeString: text.start.split('.')[0]
        });

        /*let textNode = Comment({
          avatarSrc: 'https://randomuser.me/api/portraits/women/25.jpg',
          name: 'Satya Nadella',
          comment: text.text,
          timeString: text.start
        });*/

        let $t = $(textNode).addClass('visible');
        this.DOM.transcriptionTimeline.append($t);
      }
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

      this.DOM.transcriptionTimeline.append($t);
      setTimeout(() => { $t.addClass('visible'); }, 100);
      this.transcript.index++;
    }
  }
}

class Analytic {
  constructor() {}

  init() {
    this.renderLineGraph();
  }

  renderLineGraph() {
    let margin = {top: 20, right: 20, bottom: 30, left: 50};
    let width = $('.container-right').innerWidth() - margin.left - margin.right
    let height = $('.container-right > .top').innerHeight() - margin.top - margin.bottom;

    let parseTime = d3.timeParse('%H:%M:%S');

    let x = d3.scaleTime().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);

    let svg = d3.select('#viz_engagement')
      .attr('class', 'visualization')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform',
        'translate(' + margin.left + ',' + margin.top + ')');

    // [Time, angry, applause, dislike, like, love]
    let dataFactory = () => {
      let seconds = -1;
      let minutes = 0;
      let f = (t) => { return t < 10 ? `0${t}` : t; };
      let r = (max) => { return ~~(Math.random() * max)};
      let lastStep = [0,0,0,0,0];
      let factor = 5;
      let generateStep = () => {
        let newStep = lastStep.map((value) => {
          let halfEnvelope = (1/factor)/2;
          let max = Math.min(1, value + halfEnvelope);
          let min = Math.max(0, value - halfEnvelope);
          return Math.random()*(max-min)+min;
        });
        lastStep = newStep;
        return newStep;
      };

      return Array.apply(null, Array(200)).map(() => {
        seconds++;
        if (seconds > 59) { minutes++; seconds = 0; }

        return [`12:${f(minutes)}:${f(seconds)}`, ...generateStep()];
      });
    };
    let data = dataFactory();

    x.domain(d3.extent(data, function(d) { return parseTime(d[0]); }));
    y.domain([0, d3.max(data, function(d) {
      return Math.max(0, 1); })]);

    let colors = [
      null,
      '#575DA9',
      '#EC028C',
      '#FF8C00',
      '#FDB813',
      '#b9fd75'
    ];
    for (let i = 1; i < 6; ++i) {
      let line = d3.line()
        .x(function(d) { return x(parseTime(d[0])); })
        .y(function(d) { return y(d[i]); });

      svg
        .append('path')
        .data([data])
        .attr('class', 'line')
        .style('fill', 'none')
        .style('stroke', colors[i])
        .style('stroke-width', 3)
        .attr('d', line)
        .on('mouseover', function(d) {
          d3.select(this)
            .transition()
            .style('stroke-width', 6);
        })
        .on('mouseout', function(d) {
          d3.select(this)
            .transition()
            .style('stroke-width', 3);
        });
    }

    // Add the X Axis
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .attr('class', 'axis')
      .call(d3.axisBottom(x));

    // Add the Y Axis
    svg
      .append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));
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
