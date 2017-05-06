import "babel-polyfill";
import $ from "jquery";
import * as d3 from "d3";

import Comment from "../templates/comment.handlebars"
import TranscribedText from "../templates/transcribed_text.handlebars"

class Attendee {
  constructor() {
    this.DOM = {
      languageSelect: {
        confirm: $('#language_select_confirm'),
        search: $('#language_selection_search'),
        selectionGroup: $('#language_selection_group'),
        trigger: $('.language-select-trigger')
      },
      transcriptionTimeline: $('#transcription_timeline')
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
    for (let text of texts) {
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

        this.DOM.transcriptionTimeline.append(textNode);
      }
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
