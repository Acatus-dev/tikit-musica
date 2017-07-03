(function($, VF, undefined) {/**
 * Changes:
 * 1) draw(): let left justified notes align with note heads on the left
 * 2) format(): take text height into account when calculating text_line
 * 3) format(): increase text_lines of annotations separately for top, bottom and the rest
 * 4) draw(): Fixed that annotations below stem-less notes with outside of the staff system didn't get
 * shifted with their note
 */



  Vex.Flow.Annotation.prototype.setMeiElement = function (element) {
    this.meiElement = element;
    return this;
  };

  Vex.Flow.Annotation.prototype.getMeiElement = function () {
    return this.meiElement;
  };


  Vex.Flow.Annotation.format = function (annotations, state) {
    if (!annotations || annotations.length === 0) return false;

    var text_line = state.text_line;
    var top_text_line = state.top_text_line;
    var bottom_text_line = state.bottom_text_line;
    var max_width = 0;

    // TODO get this from the stave
    var spacing_between_lines = 10;
    var height_in_lines;

    // Format Annotations
    var width;
    for (var i = 0; i < annotations.length; ++i) {
      var annotation = annotations[i];

      height_in_lines = (annotation.font.size / spacing_between_lines) * 1.5;

      if (annotation.vert_justification === 1) {
        annotation.setTextLine(top_text_line);
        top_text_line += height_in_lines;
      } else if (annotation.vert_justification === 3) {
        annotation.setTextLine(bottom_text_line);
        bottom_text_line += height_in_lines;
      } else {

        annotation.setTextLine(text_line);
        text_line += height_in_lines;
      }

      width = annotation.getWidth() > max_width ? annotation.getWidth() : max_width;
    }

    state.left_shift += width / 2;
    state.right_shift += width / 2;

    state.text_line = text_line;
    state.top_text_line = top_text_line;
    state.bottom_text_line = bottom_text_line;

    return true;
  };


  Vex.Flow.Annotation.prototype.draw = function () {

    // START ADDITION
    var Annotation = Vex.Flow.Annotation;
    var Modifier = Vex.Flow.Modifier;
    // END ADDITION

    if (!this.context) throw new Vex.RERR("NoContext", "Can't draw text annotation without a context.");
    if (!this.note) throw new Vex.RERR("NoNoteForAnnotation", "Can't draw text annotation without an attached note.");

    var start = this.note.getModifierStartXY(Modifier.Position.ABOVE, this.index);

    // We're changing context parameters. Save current state.
    this.context.save();
    this.context.setFont(this.font.family, this.font.size, this.font.weight);
    var text_width = this.context.measureText(this.text).width;

    // Estimate text height to be the same as the width of an 'm'.
    //
    // This is a hack to work around the inability to measure text height
    // in HTML5 Canvas (and SVG).
    var text_height = this.context.measureText("m").width;
    var x, y;

    if (this.justification == Annotation.Justify.LEFT) {
      // START MODIFIFICATION
      //x = start.x;
      x = this.note.getAbsoluteX();
      // END MODIFICATION
    } else if (this.justification == Annotation.Justify.RIGHT) {
      x = start.x - text_width;
    } else if (this.justification == Annotation.Justify.CENTER) {
      x = start.x - text_width / 2;
    } else /* CENTER_STEM */ {
      x = this.note.getStemX() - text_width / 2;
    }

    var stem_ext, spacing;
    var has_stem = this.note.hasStem();
    var stave = this.note.getStave();

    // The position of the text varies based on whether or not the note
    // has a stem.
    if (has_stem) {
      stem_ext = this.note.getStem().getExtents();
    }
    spacing = stave.getSpacingBetweenLines();

    if (this.vert_justification == Annotation.VerticalJustify.BOTTOM) {
      y = stave.getYForBottomText(this.text_line);
      //console.log('y ' +this.text_line);
      if (has_stem) {
        var stem_base = (this.note.getStemDirection() === 1 ? stem_ext.baseY : stem_ext.topY);
        y = Math.max(y, stem_base + 7 + (spacing * ((this.text_line) + 2)));
      } else {
        y = Math.max(y, this.note.getYs()[0] + 7 + (spacing * ((this.text_line) + 2)));
      }

    } else if (this.vert_justification == Annotation.VerticalJustify.CENTER) {
      var yt = this.note.getYForTopText(this.text_line) - 1;
      var yb = stave.getYForBottomText(this.text_line);
      y = yt + ( yb - yt ) / 2 + text_height / 2;

    } else if (this.vert_justification == Annotation.VerticalJustify.TOP) {
      y = Math.min(stave.getYForTopText(this.text_line), this.note.getYs()[0] - text_height);
      if (has_stem) {
        y = Math.min(y, (stem_ext.topY - 7) - (spacing * this.text_line));
      }
    } else /* CENTER_STEM */{
      var extents = this.note.getStemExtents();
      y = extents.topY + (extents.baseY - extents.topY) / 2 + text_height / 2;
    }


    // START ADDITION
    this.x = x;
    this.y = y;
    this.text_height = text_height;
    this.text_width = text_width;
    // END ADDITION

    //var context = this.context;
    //context.save();
    //context.beginPath();
    //context.rect(x, y-this.text_height, this.text_width, this.text_height);
    //context.fillStyle = 'rgba(0, 0, 255, 0.5)';
    //context.fill();
    //context.restore();


    this.context.fillText(this.text, x, y);
    this.context.restore();
  };



/**
 * Changes:
 * 1) let left justified notes align with note heads on the left
 * 2) use this.text_line * 2 instead of this.text_line as y starting point so annotations don't
 * collide when default font sizes are used
 * 3) increase text_lines of annotations separately for top, bottom and the rest
 */



  // ## Static Methods
    // Arrange articulations inside `ModifierContext`
  Vex.Flow.Articulation.format = function(articulations, state) {
    if (!articulations || articulations.length === 0) return false;

    var text_line = state.text_line;
    var top_text_line = state.top_text_line;
    var bottom_text_line = state.bottom_text_line;
    var max_width = 0;

    // Format Articulations
    var width;
    for (var i = 0; i < articulations.length; ++i) {
      var articulation = articulations[i];

      var type = Vex.Flow.articulationCodes(articulation.type);

      if (articulation.position === 3) {
        articulation.setTextLine(top_text_line);
        top_text_line += (type.between_lines) ? 1 : 1.5;
      } else if (articulation.position === 4) {
        articulation.setTextLine(bottom_text_line);
        bottom_text_line += (type.between_lines) ? 1 : 1.5;
      } else {
        articulation.setTextLine(text_line);
        text_line += (type.between_lines) ? 1 : 1.5;
      }

      width = articulation.getWidth() > max_width ?
              articulation.getWidth() : max_width;
    }

    state.left_shift += width / 2;
    state.right_shift += width / 2;

    state.text_line = text_line;
    state.top_text_line = top_text_line;
    state.bottom_text_line = bottom_text_line;

    return true;
  };


  Vex.Flow.Articulation.prototype.draw = function () {
    var Modifier = Vex.Flow.Modifier;
    var L = function () {
    };
    if (!this.context) throw new Vex.RERR("NoContext", "Can't draw Articulation without a context.");
    if (!(this.note && (this.index !== null))) {
      throw new Vex.RERR("NoAttachedNote", "Can't draw Articulation without a note and index.");
    }

    var stem_direction = this.note.getStemDirection();
    var stave = this.note.getStave();

    var is_on_head = (this.position === Modifier.Position.ABOVE && stem_direction === Vex.Flow.StaveNote.STEM_DOWN) ||
                     (this.position === Modifier.Position.BELOW && stem_direction === Vex.Flow.StaveNote.STEM_UP);

    var needsLineAdjustment = function (articulation, note_line, line_spacing) {
      var offset_direction = (articulation.position === Modifier.Position.ABOVE) ? 1 : -1;
      if (!is_on_head && !articulation.getNote().hasStem()) {
        // Add stem length, inless it's on a whole note
        note_line += offset_direction * 3.5;
      }

      var articulation_line = note_line + (offset_direction * line_spacing);

      return (articulation_line >= 1 && articulation_line <= 5 && articulation_line % 1 === 0);
    };

    // Articulations are centered over/under the note head.
    var start = this.note.getModifierStartXY(this.position, this.index);
    var glyph_y = start.y;
    var shiftY = 0;
    var line_spacing = 1;
    var spacing = stave.getSpacingBetweenLines();
    var is_tabnote = this.note.getCategory() === 'tabnotes';
    var stem_ext = this.note.getStem().getExtents();

    var top = stem_ext.topY;
    var bottom = stem_ext.baseY;

    if (stem_direction === Vex.Flow.StaveNote.STEM_DOWN) {
      top = stem_ext.baseY;
      bottom = stem_ext.topY;
    }

    // TabNotes don't have stems attached to them. Tab stems are rendered
    // outside the stave.
    if (is_tabnote) {
      if (this.note.hasStem()) {
        if (stem_direction === Vex.Flow.StaveNote.STEM_UP) {
          bottom = stave.getYForBottomText(this.text_line - 2);
        } else if (stem_direction === Vex.Flow.StaveNote.STEM_DOWN) {
          top = stave.getYForTopText(this.text_line - 1.5);
        }
      } else { // Without a stem
        top = stave.getYForTopText(this.text_line - 1);
        bottom = stave.getYForBottomText(this.text_line - 2);
      }
    }

    var is_above = (this.position === Modifier.Position.ABOVE);
    var note_line = this.note.getLineNumber(is_above);

    // Beamed stems are longer than quarter note stems.
    if (!is_on_head && this.note.beam) {
      line_spacing = this.note.beam.beam_count * 0.5;
    }

    // If articulation will overlap a line, reposition it.
    if (needsLineAdjustment(this, note_line, line_spacing)) line_spacing += 0.5;

    var glyph_y_between_lines;
    if (this.position === Modifier.Position.ABOVE) {
      shiftY = this.articulation.shift_up;
      glyph_y_between_lines = (top - 7) - (spacing * (this.text_line + line_spacing));

      if (this.articulation.between_lines) {
        glyph_y = glyph_y_between_lines;
      } else {
        glyph_y = Math.min(stave.getYForTopText(this.text_line) - 3, glyph_y_between_lines);
      }
    } else {
      shiftY = this.articulation.shift_down - 10;

      glyph_y_between_lines = bottom + 10 + spacing * (this.text_line + line_spacing);
      if (this.articulation.between_lines) {
        glyph_y = glyph_y_between_lines;
      } else {
        glyph_y = Math.max(stave.getYForBottomText(this.text_line), glyph_y_between_lines);
      }
    }

    var glyph_x = start.x + this.articulation.shift_right;
    glyph_y += shiftY + this.y_shift;

    L("Rendering articulation: ", this.articulation, glyph_x, glyph_y);
    Vex.Flow.renderGlyph(this.context, glyph_x, glyph_y, this.render_options.font_scale, this.articulation.code);

    //var context = this.context;
    //context.save();
    //context.beginPath();
    //context.rect(glyph_x, glyph_y, 10, 10);
    //context.fillStyle = 'rgba(0, 0, 255, 0.5)';
    //context.fill();
    //context.restore();


    // ### START ADDITION
    this.x = glyph_x;
    this.y = glyph_y;
    // ### END ADDITION

  };






/**
 * Changes:
 * 1) set default partial beam direction to left instead of right (that's the correct direction in
 * most cases; in order to get 100% correct beams, the direction must be calculated on basis of the
 * metrical position of the beam)
 * 2) Changed beaming behavior: Never beam rests, draw partial beams instead
 * 3) Treat rests in beams distinctly so they don't clash with their beam when the beam is
 * below and they don't claim too much space when the beam is above
 * 4) extend beam stems of notes with diverging stem direction
 */






  // [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
  //
  // ## Description
  //
  // This file implements `Beams` that span over a set of `StemmableNotes`.
  //
  // Requires: vex.js, vexmusic.js, note.js
  Vex.Flow.Beam = (function () {
    function Beam(notes, auto_stem) {
      if (arguments.length > 0) this.init(notes, auto_stem);
    }

    var Stem = Vex.Flow.Stem;

    // ## Prototype Methods
    Beam.prototype = {
      init : function (notes, auto_stem) {
        if (!notes || notes == []) {
          throw new Vex.RuntimeError("BadArguments", "No notes provided for beam.");
        }

        if (notes.length == 1) {
          throw new Vex.RuntimeError("BadArguments", "Too few notes for beam.");
        }

        // Validate beam line, direction and ticks.
        this.ticks = notes[0].getIntrinsicTicks();

        if (this.ticks >= Vex.Flow.durationToTicks("4")) {
          throw new Vex.RuntimeError("BadArguments", "Beams can only be applied to notes shorter than a quarter note.");
        }

        var i; // shared iterator
        var note;

        this.stem_direction = Stem.UP;

        for (i = 0; i < notes.length; ++i) {
          note = notes[i];
          if (note.hasStem()) {
            this.stem_direction = note.getStemDirection();
            break;
          }
        }

        var stem_direction = this.stem_direction;
        // Figure out optimal stem direction based on given notes
        if (auto_stem && notes[0].getCategory() === 'stavenotes') {
          stem_direction = calculateStemDirection(notes);
        } else if (auto_stem && notes[0].getCategory() === 'tabnotes') {
          // Auto Stem TabNotes
          var stem_weight = notes.reduce(function (memo, note) {
            return memo + note.stem_direction;
          }, 0);

          stem_direction = stem_weight > -1 ? Stem.UP : Stem.DOWN;
        }

        // Apply stem directions and attach beam to notes
        for (i = 0; i < notes.length; ++i) {
          note = notes[i];
          if (auto_stem) {
            note.setStemDirection(stem_direction);
            this.stem_direction = stem_direction;
          }
          note.setBeam(this);
        }

        this.postFormatted = false;
        this.notes = notes;
        this.beam_count = this.getBeamCount();
        this.break_on_indices = [];
        this.render_options = {
          beam_width : 5,
          max_slope : 0.25,
          min_slope : -0.25,
          slope_iterations : 20,
          slope_cost : 100,
          show_stemlets : false,
          stemlet_extension : 7,
          partial_beam_length : 10
        };
      },

      // The the rendering `context`
      setContext : function (context) {
        this.context = context;
        return this;
      },

      // Get the notes in this beam
      getNotes : function () {
        return this.notes;
      },

      // Get the max number of beams in the set of notes
      getBeamCount : function () {
        var beamCounts = this.notes.map(function (note) {
          return note.getGlyph().beam_count;
        });

        var maxBeamCount = beamCounts.reduce(function (max, beamCount) {
          return beamCount > max ? beamCount : max;
        });

        return maxBeamCount;
      },

      // Set which note `indices` to break the secondary beam at
      breakSecondaryAt : function (indices) {
        this.break_on_indices = indices;
        return this;
      },

      // Return the y coordinate for linear function
      getSlopeY : function (x, first_x_px, first_y_px, slope) {
        return first_y_px + ((x - first_x_px) * slope);
      },

      // Calculate the best possible slope for the provided notes
      calculateSlope : function () {
        var first_note = this.notes[0];
        var first_y_px = first_note.getStemExtents().topY;
        var first_x_px = first_note.getStemX();

        var inc = (this.render_options.max_slope - this.render_options.min_slope) /
                  this.render_options.slope_iterations;
        var min_cost = Number.MAX_VALUE;
        var best_slope = 0;
        var y_shift = 0;

        // iterate through slope values to find best weighted fit
        for (var slope = this.render_options.min_slope; slope <= this.render_options.max_slope; slope += inc) {
          var total_stem_extension = 0;
          var y_shift_tmp = 0;

          // iterate through notes, calculating y shift and stem extension
          for (var i = 1; i < this.notes.length; ++i) {
            var note = this.notes[i];

            var x_px = note.getStemX();
            var y_px = note.getStemExtents().topY;

            // QUICKFIX
            if (note.isRest()) {
              y_px = (this.stem_direction === -1) ? y_px + 70 : y_px + 10;
            }

            var slope_y_px = this.getSlopeY(x_px, first_x_px, first_y_px, slope) + y_shift_tmp;

            // beam needs to be shifted up to accommodate note
            if (y_px * this.stem_direction < slope_y_px * this.stem_direction) {
              var diff = Math.abs(y_px - slope_y_px);
              y_shift_tmp += diff * -this.stem_direction;
              total_stem_extension += (diff * i);
            } else { // beam overshoots note, account for the difference
              total_stem_extension += (y_px - slope_y_px) * this.stem_direction;
            }

          }

          var last_note = this.notes[this.notes.length - 1];
          var first_last_slope = ((last_note.getStemExtents().topY - first_y_px) / (last_note.getStemX() - first_x_px));
          // most engraving books suggest aiming for a slope about half the angle of the
          // difference between the first and last notes' stem length;
          var ideal_slope = first_last_slope / 2;
          var distance_from_ideal = Math.abs(ideal_slope - slope);

          // This tries to align most beams to something closer to the ideal_slope, but
          // doesn't go crazy. To disable, set this.render_options.slope_cost = 0
          var cost = this.render_options.slope_cost * distance_from_ideal + Math.abs(total_stem_extension);

          // update state when a more ideal slope is found
          if (cost < min_cost) {
            min_cost = cost;
            best_slope = slope;
            y_shift = y_shift_tmp;
          }
        }

        this.slope = best_slope;
        this.y_shift = y_shift;
      },

      // Create new stems for the notes in the beam, so that each stem
      // extends into the beams.
      applyStemExtensions : function () {
        var first_note = this.notes[0];
        var first_y_px = first_note.getStemExtents().topY;
        var first_x_px = first_note.getStemX();

        for (var i = 0; i < this.notes.length; ++i) {
          var note = this.notes[i];

          var x_px = note.getStemX();
          var y_extents = note.getStemExtents();
          var base_y_px = y_extents.baseY;
          var top_y_px = y_extents.topY;

          // For harmonic note heads, shorten stem length by 3 pixels
          base_y_px += this.stem_direction * note.glyph.stem_offset;

          // Don't go all the way to the top (for thicker stems)
          var y_displacement = Vex.Flow.STEM_WIDTH;

          if (!note.hasStem()) {
            // SKIPPED in MEI2VF
            //if (note.isRest() && this.render_options.show_stemlets) {
            //  var centerGlyphX = note.getCenterGlyphX();
            //
            //  var width = this.render_options.beam_width;
            //  var total_width = ((this.beam_count - 1) * width * 1.5) + width;
            //
            //  var stemlet_height = (total_width - y_displacement + this.render_options.stemlet_extension);
            //
            //  var beam_y = this.getSlopeY(centerGlyphX, first_x_px, first_y_px, this.slope) + this.y_shift;
            //  var start_y = beam_y + (Vex.Flow.Stem.HEIGHT * this.stem_direction);
            //  var end_y = beam_y + (stemlet_height * this.stem_direction);
            //
            //  // Draw Stemlet
            //  note.setStem(new Vex.Flow.Stem({
            //    x_begin : centerGlyphX,
            //    x_end : centerGlyphX,
            //    y_bottom : this.stem_direction === 1 ? end_y : start_y,
            //    y_top : this.stem_direction === 1 ? start_y : end_y,
            //    y_extend : y_displacement,
            //    stem_extension : -1, // To avoid protruding through the beam
            //    stem_direction : this.stem_direction
            //  }));
            //}
            continue;
          }

          var slope_y = this.getSlopeY(x_px, first_x_px, first_y_px, this.slope) + this.y_shift;

          var note_stem_dir = note.getStemDirection();
          var beam_width = this.render_options.beam_width;
          var stem_through_beams_length = beam_width- 1;
          var regular_beam_count = 0;
          var stem_extension;

          if (note_stem_dir === this.stem_direction) {
            // set stem extension for notes on the regular side of the beam
            stem_extension = Math.abs(top_y_px - slope_y) - Stem.HEIGHT - 1;

          } else {
            // set stem extension for notes on the opposite side of the beam

            var prev_note;
            var k = i;
            while (k--) {
              prev_note = this.notes[k];
              if (prev_note.stem_direction === this.stem_direction) {
                regular_beam_count = prev_note.getBeamCount();
                break;
              }
            }
            //            var next_note = this.notes[i+1];
            //            prev_note.getBeamCount() - next_note.getBeamCount()

            if (regular_beam_count > 1) {
              regular_beam_count = Math.min(regular_beam_count, note.getGlyph().beam_count);
              stem_through_beams_length += (regular_beam_count - 1) * beam_width * 1.5;
            }
            stem_extension = -Math.abs(top_y_px - slope_y) - Stem.HEIGHT + .5 + stem_through_beams_length;
          }


          note.setStem(new Vex.Flow.Stem({
            x_begin : x_px - (Vex.Flow.STEM_WIDTH / 2),
            x_end : x_px,
            y_top : note_stem_dir === 1 ? top_y_px : base_y_px,
            y_bottom : note_stem_dir === 1 ? base_y_px : top_y_px,
            y_extend : y_displacement,
            stem_extension : stem_extension,
            stem_direction : note_stem_dir
          }));


        }
      },

      // Get the x coordinates for the beam lines of specific `duration`
      getBeamLines : function (duration) {
        var beam_lines = [];
        var beam_started = false;
        var current_beam;
        var partial_beam_length = this.render_options.partial_beam_length;

        function determinePartialSide(prev_note, next_note) {
          // Compare beam counts and store differences
          var unshared_beams = 0;
          if (next_note && prev_note) {
            unshared_beams = prev_note.getBeamCount() - next_note.getBeamCount();
          }

          //          var left_partial = duration !== "8" && unshared_beams > 0;
          var right_partial = duration !== "8" && unshared_beams < 0;

          return {
            left : prev_note, right : right_partial
          };
        }

        for (var i = 0; i < this.notes.length; ++i) {
          var note = this.notes[i];
          var prev_note = this.notes[i - 1];
          var next_note = this.notes[i + 1];
          var ticks = note.getIntrinsicTicks();
          var partial = determinePartialSide(prev_note, next_note);
          var stem_x = note.isRest() ? note.getCenterGlyphX() : note.getStemX();

          // Check whether to apply beam(s)
          if (ticks < Vex.Flow.durationToTicks(duration)) {
            if (!beam_started) {
              if (!note.isRest()) {

                var new_line = {
                  start : stem_x, end : null, flipped : note.getStemDirection() !== this.stem_direction
                };

                if (partial.left && !partial.right) {
                  new_line.end = stem_x - partial_beam_length;
                }

                beam_lines.push(new_line);
                beam_started = true;
              }
            } else {
              current_beam = beam_lines[beam_lines.length - 1];
              current_beam.end = stem_x;

              // Should break secondary beams on note
              var should_break = this.break_on_indices.indexOf(i) !== -1;
              // Shorter than or eq an 8th note duration
              var can_break = parseInt(duration, 10) >= 8;
              if (should_break && can_break) {
                beam_started = false;
              }
            }
          } else {
            if (!beam_started) {
              // we don't care
            } else {
              current_beam = beam_lines[beam_lines.length - 1];
              if (current_beam.end == null) {
                // single note
                current_beam.end = current_beam.start + partial_beam_length;
              } else {
                // we don't care
              }
            }

            beam_started = false;
          }
        }

        if (beam_started === true) {
          current_beam = beam_lines[beam_lines.length - 1];
          if (current_beam.end == null) {
            // single note
            current_beam.end = current_beam.start - partial_beam_length;
          }
        }

        return beam_lines;
      },

      // Render the stems for each notes
      drawStems : function () {
        this.notes.forEach(function (note) {
          if (note.getStem()) {
            note.getStem().setContext(this.context).draw();
          }
        }, this);
      },

      // Render the beam lines
      drawBeamLines : function () {
        if (!this.context) throw new Vex.RERR("NoCanvasContext", "Can't draw without a canvas context.");

        var valid_beam_durations = [
          "4",
          "8",
          "16",
          "32",
          "64"
        ];

        var first_note = this.notes[0];
        var last_note = this.notes[this.notes.length - 1];

        var first_y_px = first_note.getStemExtents().topY;
        var last_y_px = last_note.getStemExtents().topY;

        var first_x_px = first_note.getStemX();

        var beam_width = this.render_options.beam_width * this.stem_direction;

        // Draw the beams.
        for (var i = 0; i < valid_beam_durations.length; ++i) {
          var duration = valid_beam_durations[i];
          var beam_lines = this.getBeamLines(duration);

          for (var j = 0; j < beam_lines.length; ++j) {
            var beam_line = beam_lines[j];

            if (!beam_line.flipped) {
              var first_x = beam_line.start - (this.stem_direction == Stem.DOWN ? Vex.Flow.STEM_WIDTH / 2 : 0);
              var first_y = this.getSlopeY(first_x, first_x_px, first_y_px, this.slope);

              var last_x = beam_line.end +
                           (this.stem_direction == 1 ? (Vex.Flow.STEM_WIDTH / 3) : (-Vex.Flow.STEM_WIDTH / 3));
              var last_y = this.getSlopeY(last_x, first_x_px, first_y_px, this.slope);

              this.context.beginPath();
              this.context.moveTo(first_x, first_y + this.y_shift);
              this.context.lineTo(first_x, first_y + beam_width + this.y_shift);
              this.context.lineTo(last_x + 1, last_y + beam_width + this.y_shift);
              this.context.lineTo(last_x + 1, last_y + this.y_shift);
              this.context.closePath();
              this.context.fill();
            }
          }

          first_y_px += beam_width * 1.5;
          last_y_px += beam_width * 1.5;
        }


        // TODO integrate!:


        beam_width = this.render_options.beam_width * this.stem_direction * -1;

        first_y_px = first_note.getStemExtents().topY + (beam_width * 0.5);
        last_y_px = last_note.getStemExtents().topY + (beam_width * 0.5);

        first_x_px = first_note.getStemX();

        var inc = false;

        // Draw the beams.
        for (i = 0; i < valid_beam_durations.length; ++i) {
          duration = valid_beam_durations[i];
          beam_lines = this.getBeamLines(duration);

          for (j = 0; j < beam_lines.length; ++j) {
            beam_line = beam_lines[j];

            if (beam_line.flipped) {
              inc = true;

              first_x = beam_line.start - (this.stem_direction * -1 == Stem.DOWN ? Vex.Flow.STEM_WIDTH / 2 : 0);
              first_y = this.getSlopeY(first_x, first_x_px, first_y_px, this.slope);

              last_x =
              beam_line.end + (this.stem_direction * -1 == 1 ? (Vex.Flow.STEM_WIDTH / 3) : (-Vex.Flow.STEM_WIDTH / 3));
              last_y = this.getSlopeY(last_x, first_x_px, first_y_px, this.slope);

              this.context.beginPath();
              this.context.moveTo(first_x, first_y + this.y_shift);
              this.context.lineTo(first_x, first_y + beam_width + this.y_shift);
              this.context.lineTo(last_x + 1, last_y + beam_width + this.y_shift);
              this.context.lineTo(last_x + 1, last_y + this.y_shift);
              this.context.closePath();
              this.context.fill();

            }
          }

          if (inc) {
            first_y_px += beam_width * 1.5;
            last_y_px += beam_width * 1.5;
          }

        }

      },

      // Pre-format the beam
      preFormat : function () {
        return this;
      },

      // Post-format the beam. This can only be called after
      // the notes in the beam have both `x` and `y` values. ie: they've
      // been formatted and have staves
      postFormat : function () {
        if (this.postFormatted) return;

        this.calculateSlope();
        this.applyStemExtensions();

        this.postFormatted = true;
      },

      // Render the beam to the canvas context
      draw : function () {
        if (!this.context) throw new Vex.RERR("NoCanvasContext", "Can't draw without a canvas context.");

        if (this.unbeamable) return;

        if (!this.postFormatted) {
          this.postFormat();
        }

        this.drawStems();
        this.drawBeamLines();

        return true;
      }
    };

    function calculateStemDirection(notes) {
      var lineSum = 0;
      notes.forEach(function (note) {
        if (note.keyProps) {
          note.keyProps.forEach(function (keyProp) {
            lineSum += (keyProp.line - 3);
          });
        }
      });

      if (lineSum >= 0) {
        return Stem.DOWN;
      }
      return Stem.UP;
    }

    //    // ## Static Methods
    //    //
    //    // Gets the default beam groups for a provided time signature.
    //    // Attempts to guess if the time signature is not found in table.
    //    // Currently this is fairly naive.
    //    Beam.getDefaultBeamGroups = function (time_sig) {
    //      if (!time_sig || time_sig == "c") time_sig = "4/4";
    //
    //      var defaults = {
    //        '1/2' : ['1/2'],
    //        '2/2' : ['1/2'],
    //        '3/2' : ['1/2'],
    //        '4/2' : ['1/2'],
    //
    //        '1/4' : ['1/4'],
    //        '2/4' : ['1/4'],
    //        '3/4' : ['1/4'],
    //        '4/4' : ['1/4'],
    //
    //        '1/8' : ['1/8'],
    //        '2/8' : ['2/8'],
    //        '3/8' : ['3/8'],
    //        '4/8' : ['2/8'],
    //
    //        '1/16' : ['1/16'],
    //        '2/16' : ['2/16'],
    //        '3/16' : ['3/16'],
    //        '4/16' : ['2/16']
    //      };
    //
    //      var Fraction = Vex.Flow.Fraction;
    //      var groups = defaults[time_sig];
    //
    //      if (!groups) {
    //        // If no beam groups found, naively determine
    //        // the beam groupings from the time signature
    //        var beatTotal = parseInt(time_sig.split('/')[0], 10);
    //        var beatValue = parseInt(time_sig.split('/')[1], 10);
    //
    //        var tripleMeter = beatTotal % 3 === 0;
    //
    //        if (tripleMeter) {
    //          return [new Fraction(3, beatValue)];
    //        } else if (beatValue > 4) {
    //          return [new Fraction(2, beatValue)];
    //        } else if (beatValue <= 4) {
    //          return [new Fraction(1, beatValue)];
    //        }
    //      } else {
    //        return groups.map(function (group) {
    //          return new Fraction().parse(group);
    //        });
    //      }
    //    };
    //
    //    // A helper function to automatically build basic beams for a voice. For more
    //    // complex auto-beaming use `Beam.generateBeams()`.
    //    //
    //    // Parameters:
    //    // * `voice` - The voice to generate the beams for
    //    // * `stem_direction` - A stem direction to apply to the entire voice
    //    // * `groups` - An array of `Fraction` representing beat groupings for the beam
    //    Beam.applyAndGetBeams = function (voice, stem_direction, groups) {
    //      return Beam.generateBeams(voice.getTickables(), {
    //        groups : groups,
    //        stem_direction : stem_direction
    //      });
    //    };
    //
    //    // A helper function to autimatically build beams for a voice with
    //    // configuration options.
    //    //
    //    // Example configuration object:
    //    //
    //    // ```
    //    // config = {
    //    //   groups: [new Vex.Flow.Fraction(2, 8)],
    //    //   stem_direction: -1,
    //    //   beam_rests: true,
    //    //   beam_middle_only: true,
    //    //   show_stemlets: false
    //    // };
    //    // ```
    //    //
    //    // Parameters:
    //    // * `notes` - An array of notes to create the beams for
    //    // * `config` - The configuration object
    //    //    * `groups` - Array of `Fractions` that represent the beat structure to beam the notes
    //    //    * `stem_direction` - Set to apply the same direction to all notes
    //    //    * `beam_rests` - Set to `true` to include rests in the beams
    //    //    * `beam_middle_only` - Set to `true` to only beam rests in the middle of the beat
    //    //    * `show_stemlets` - Set to `true` to draw stemlets for rests
    //    //    * `maintain_stem_directions` - Set to `true` to not apply new stem directions
    //    //
    //    Beam.generateBeams = function (notes, config) {
    //
    //      if (!config) config = {};
    //
    //      if (!config.groups || !config.groups.length) {
    //        config.groups = [new Vex.Flow.Fraction(2, 8)];
    //      }
    //
    //      // Convert beam groups to tick amounts
    //      var tickGroups = config.groups.map(function (group) {
    //        if (!group.multiply) {
    //          throw new Vex.RuntimeError("InvalidBeamGroups", "The beam groups must be an array of Vex.Flow.Fractions");
    //        }
    //        return group.clone().multiply(Vex.Flow.RESOLUTION, 1);
    //      });
    //
    //      var unprocessedNotes = notes;
    //      var currentTickGroup = 0;
    //      var noteGroups = [];
    //      var currentGroup = [];
    //
    //      function getTotalTicks(vf_notes) {
    //        return vf_notes.reduce(function (memo, note) {
    //          return note.getTicks().clone().add(memo);
    //        }, new Vex.Flow.Fraction(0, 1));
    //      }
    //
    //      function nextTickGroup() {
    //        if (tickGroups.length - 1 > currentTickGroup) {
    //          currentTickGroup += 1;
    //        } else {
    //          currentTickGroup = 0;
    //        }
    //      }
    //
    //      function createGroups() {
    //        var nextGroup = [];
    //
    //        unprocessedNotes.forEach(function (unprocessedNote) {
    //          nextGroup = [];
    //          if (unprocessedNote.shouldIgnoreTicks()) {
    //            noteGroups.push(currentGroup);
    //            currentGroup = nextGroup;
    //            return; // Ignore untickables (like bar notes)
    //          }
    //
    //          currentGroup.push(unprocessedNote);
    //          var ticksPerGroup = tickGroups[currentTickGroup].clone();
    //          var totalTicks = getTotalTicks(currentGroup);
    //
    //          // Double the amount of ticks in a group, if it's an unbeamable tuplet
    //          var unbeamable = Vex.Flow.durationToNumber(unprocessedNote.duration) < 8;
    //          if (unbeamable && unprocessedNote.tuplet) {
    //            ticksPerGroup.numerator *= 2;
    //          }
    //
    //          // If the note that was just added overflows the group tick total
    //          if (totalTicks.greaterThan(ticksPerGroup)) {
    //            // If the overflow note can be beamed, start the next group
    //            // with it. Unbeamable notes leave the group overflowed.
    //            if (!unbeamable) {
    //              nextGroup.push(currentGroup.pop());
    //            }
    //            noteGroups.push(currentGroup);
    //            currentGroup = nextGroup;
    //            nextTickGroup();
    //          } else if (totalTicks.equals(ticksPerGroup)) {
    //            noteGroups.push(currentGroup);
    //            currentGroup = nextGroup;
    //            nextTickGroup();
    //          }
    //        });
    //
    //        // Adds any remainder notes
    //      if (currentGroup.length > 0)
    //          noteGroups.push(currentGroup);
    //        }
    //
    //      function getBeamGroups() {
    //        return noteGroups.filter(function (group) {
    //          if (group.length > 1) {
    //            var beamable = true;
    //            group.forEach(function (note) {
    //              if (note.getIntrinsicTicks() >= Vex.Flow.durationToTicks("4")) {
    //                beamable = false;
    //              }
    //            });
    //            return beamable;
    //          }
    //          return false;
    //        });
    //      }
    //
    //      // Splits up groups by Rest
    //      function sanitizeGroups() {
    //        var sanitizedGroups = [];
    //        noteGroups.forEach(function (group) {
    //          var tempGroup = [];
    //          group.forEach(function (note, index, group) {
    //            var isFirstOrLast = index === 0 || index === group.length - 1;
    //            var prevNote = group[index - 1];
    //
    //            var breaksOnEachRest = !config.beam_rests && note.isRest();
    //            var breaksOnFirstOrLastRest = (config.beam_rests && config.beam_middle_only && note.isRest() &&
    //                                           isFirstOrLast);
    //
    //            var breakOnStemChange = false;
    //            if (config.maintain_stem_directions && prevNote && !note.isRest() && !prevNote.isRest()) {
    //              var prevDirection = prevNote.getStemDirection();
    //              var currentDirection = note.getStemDirection();
    //              breakOnStemChange = currentDirection !== prevDirection;
    //            }
    //
    //            var isUnbeamableDuration = parseInt(note.duration, 10) < 8;
    //
    //            // Determine if the group should be broken at this note
    //            var shouldBreak = breaksOnEachRest || breaksOnFirstOrLastRest || breakOnStemChange || isUnbeamableDuration;
    //
    //            if (shouldBreak) {
    //              // Add current group
    //              if (tempGroup.length > 0) {
    //                sanitizedGroups.push(tempGroup);
    //              }
    //
    //              // Start a new group. Include the current note if the group
    //              // was broken up by stem direction, as that note needs to start
    //              // the next group of notes
    //              tempGroup = breakOnStemChange ? [note] : [];
    //            } else {
    //              // Add note to group
    //              tempGroup.push(note);
    //            }
    //          });
    //
    //          // If there is a remaining group, add it as well
    //          if (tempGroup.length > 0) {
    //            sanitizedGroups.push(tempGroup);
    //          }
    //        });
    //
    //        noteGroups = sanitizedGroups;
    //      }
    //
    //      function formatStems() {
    //        noteGroups.forEach(function (group) {
    //          var stemDirection;
    //          if (config.maintain_stem_directions) {
    //            var note = findFirstNote(group);
    //            stemDirection = note ? note.getStemDirection() : Stem.UP;
    //          } else {
    //            if (config.stem_direction) {
    //              stemDirection = config.stem_direction;
    //            } else {
    //              stemDirection = calculateStemDirection(group);
    //            }
    //          }
    //          applyStemDirection(group, stemDirection);
    //        });
    //      }
    //
    //      function findFirstNote(group) {
    //        for (var i = 0; i < group.length; i++) {
    //          var note = group[i];
    //          if (!note.isRest()) {
    //            return note;
    //          }
    //        }
    //
    //        return false;
    //      }
    //
    //      function applyStemDirection(group, direction) {
    //        group.forEach(function (note) {
    //          note.setStemDirection(direction);
    //        });
    //      }
    //
    //      function getTupletGroups() {
    //        return noteGroups.filter(function (group) {
    //          if (group[0]) return group[0].tuplet;
    //        });
    //      }
    //
    //
    //      // Using closures to store the variables throughout the various functions
    //      // IMO Keeps it this process lot cleaner - but not super consistent with
    //      // the rest of the API's style - Silverwolf90 (Cyril)
    //      createGroups();
    //      sanitizeGroups();
    //      formatStems();
    //
    //      // Get the notes to be beamed
    //      var beamedNoteGroups = getBeamGroups();
    //
    //      // Get the tuplets in order to format them accurately
    //      var tupletGroups = getTupletGroups();
    //
    //      // Create a Vex.Flow.Beam from each group of notes to be beamed
    //      var beams = [];
    //      beamedNoteGroups.forEach(function (group) {
    //        var beam = new Vex.Flow.Beam(group);
    //
    //        if (config.show_stemlets) {
    //          beam.render_options.show_stemlets = true;
    //        }
    //
    //        beams.push(beam);
    //      });
    //
    //      // Reformat tuplets
    //      tupletGroups.forEach(function (group) {
    //        var firstNote = group[0];
    //        for (var i = 0; i < group.length; ++i) {
    //          if (group[i].hasStem()) {
    //            firstNote = group[i];
    //            break;
    //          }
    //        }
    //
    //        var tuplet = firstNote.tuplet;
    //
    //        if (firstNote.beam) tuplet.setBracketed(false);
    //        if (firstNote.stem_direction == Stem.DOWN) {
    //          tuplet.setTupletLocation(Vex.Flow.Tuplet.LOCATION_BOTTOM);
    //        }
    //      });
    //
    //      return beams;
    //    };

    return Beam;
  }());





  Vex.Flow.ClefNote.prototype.setMeiElement = function (element) {
    this.meiElement = element;
    return this;
  };
  Vex.Flow.ClefNote.prototype.getMeiElement = function () {
    return this.meiElement;
  };



  //######## start addition
  Vex.Flow.ClefNote.prototype.setOffsetLeft = function (offset) {
    this.offsetLeft = offset;
  };
  //######### end addition

  Vex.Flow.ClefNote.prototype.draw = function () {
    if (!this.stave) throw new Vex.RERR("NoStave", "Can't draw without a stave.");

    if (!this.glyph.getContext()) {
      this.glyph.setContext(this.context);
    }
    var abs_x = this.getAbsoluteX() - (this.offsetLeft || 0);

    this.glyph.setStave(this.stave);
    this.glyph.setYShift(this.stave.getYForLine(this.clef.line) - this.stave.getYForGlyphs());

    // ##########START MODIFICATION
    this.glyph.renderToStave(abs_x);
    // ##########END MODIFICATION

    // If the Vex.Flow.Clef has an annotation, such as 8va, draw it.
    if (this.clef_obj.annotation !== undefined) {
      var attachment = new Vex.Flow.Glyph(this.clef_obj.annotation.code, this.clef_obj.annotation.point);
      if (!attachment.getContext()) {
        attachment.setContext(this.context);
      }
      attachment.setStave(this.stave);
      attachment.setYShift(this.stave.getYForLine(this.clef_obj.annotation.line) - this.stave.getYForGlyphs());
      attachment.setXShift(this.clef_obj.annotation.x_shift);
      attachment.renderToStave(abs_x);
    }

  };





  Vex.Flow.Curve.prototype.renderCurve = function (params) {
    var ctx = this.context;
    var cps = this.render_options.cps;

    var x_shift = this.render_options.x_shift;
    var y_shift = this.render_options.y_shift * params.direction;

    // TODO name variables according to staveTie
    // START MODIFICATION (allows to specify y_shift for start & end
    // note separately):
    var y_shift_start = this.render_options.y_shift_start || 0;
    var y_shift_end = this.render_options.y_shift_end || 0;
    var first_x = params.first_x + x_shift;
    var first_y = params.first_y + y_shift + y_shift_start;
    var last_x = params.last_x - x_shift;
    var last_y = params.last_y + y_shift + y_shift_end;
    // END MODIFICATION

    var thickness = this.render_options.thickness;

    var cp_spacing = (last_x - first_x) / (cps.length + 2);

    ctx.beginPath();

    if (this.render_options.custom_cps) {
      // adjustments to MEI bezier encoding practice
      var cps_0_x = first_x + cps[0].x;
      var cps_0_y = first_y + cps[0].y;
      var cps_1_x = last_x + cps[1].x;
      var cps_1_y = last_y + cps[1].y;
      ctx.moveTo(first_x, first_y);
      ctx.bezierCurveTo(cps_0_x, cps_0_y, cps_1_x, cps_1_y, last_x, last_y);
      ctx.bezierCurveTo(cps_1_x, cps_1_y + thickness, cps_0_x, cps_0_y + thickness, first_x, first_y);
    } else {
      var cps_0_x = cps[0].x;
      var cps_0_y = cps[0].y;
      var cps_1_x = cps[1].x;
      var cps_1_y = cps[1].y;

      var x_diff = last_x-first_x;
      var y_diff = last_y-first_y;

      // decrease height of very narrow slurs
      if(x_diff < 60) {
        cps_0_y = 5 + cps_0_y * (x_diff / 120);
        cps_1_y = 5 + cps_1_y *(x_diff / 120);
      }

      // adjust cps when y_diff is bigger than x_diff
      var max_y_diff = x_diff/2;
      if (y_diff > max_y_diff) {
        if (params.direction === 1) {
          cps_0_y += Math.abs(y_diff);
        } else {
          cps_1_y += Math.abs(y_diff);
        }
      } else if (y_diff < -max_y_diff) {
        //cps[0].y += -y_diff * -1;

        if (params.direction === 1) {
          cps_1_y += Math.abs(y_diff);
        } else {
          cps_0_y += Math.abs(y_diff);
        }
      }


      ctx.moveTo(first_x, first_y);
      ctx.bezierCurveTo(first_x + cp_spacing + cps_0_x,
        first_y + (cps_0_y * params.direction),
        last_x - cp_spacing + cps_1_x,
        last_y + (cps_1_y * params.direction),
        last_x, last_y);
      ctx.bezierCurveTo(last_x - cp_spacing + cps_1_x,
        last_y + ((cps_1_y + thickness) * params.direction),
        first_x + cp_spacing + cps_0_x,
        first_y + ((cps_0_y + thickness) * params.direction),
        first_x, first_y);
    }

    ctx.stroke();
    ctx.closePath();
    ctx.fill();
  };


  Vex.Flow.Curve.prototype.draw = function () {
    //#######start addition
    var Curve = Vex.Flow.Curve;
    //###########end addition


    if (!this.context) {
      throw new Vex.RERR("NoContext", "No context to render tie.");
    }
    var first_note = this.from;
    var last_note = this.to;
    var first_x, last_x, first_y, last_y, stem_direction;

    var metric = "baseY";
    var end_metric = "baseY";
    var position = this.render_options.position;
    var position_end = this.render_options.position_end;

    if (position === Curve.Position.NEAR_TOP) {
      metric = "topY";
      end_metric = "topY";
    }

    if (position_end == Curve.Position.NEAR_HEAD) {
      end_metric = "baseY";
    } else if (position_end == Curve.Position.NEAR_TOP) {
      end_metric = "topY";
    }

    if (first_note) {
      first_x = first_note.getTieRightX();
      stem_direction = first_note.getStemDirection();
      first_y = first_note.getStemExtents()[metric];
    } else {
      // ##### START MODIFICATION
      first_x = last_note.getStave().getSlurStartX();
      // ##### END MODIFICATION
      first_y = last_note.getStemExtents()[metric];
    }

    if (last_note) {
      last_x = last_note.getTieLeftX();
      stem_direction = last_note.getStemDirection();
      last_y = last_note.getStemExtents()[end_metric];
    } else {
      // ##### START MODIFICATION
      last_x = first_note.getStave().getSlurEndX();
      // ##### END MODIFICATION
      last_y = first_note.getStemExtents()[end_metric];
    }

    this.renderCurve({
      first_x : first_x,
      last_x : last_x,
      first_y : first_y,
      last_y : last_y,
      direction : stem_direction * (this.render_options.invert === true ? -1 : 1)
    });
    return true;
  };





  Vex.Flow.articulationCodes.articulations['a^b'] = {   // Marcato below
    code : "v16",
    width : 8,
    shift_right : 0,
    shift_up : 6,
    shift_down : 8,
    between_lines : false
  };

  Vex.Flow.articulationCodes.articulations['avb'] = {   // Staccatissimo below
    code : "v66",
    width : 4,
    shift_right : 0,
    shift_up : 3,
    shift_down : -3,
    between_lines : true
  };


  Vex.Flow.Font.glyphs['v66'] = {
    "x_min" : -73.5,
    "x_max" : 72.140625,
    "ha" : 74,
    "o" : "m -36 -126 b 0 0 -17 -56 -1 0 b 70 -254 0 0 70 -249 l 72 -255 l 0 -255 l -73 -255 l -72 -254 b -36 -126 -72 -254 -55 -195 "
  };

  Vex.Flow.Font.glyphs['v16'] = {
    "x_min" : -155.171875,
    "x_max" : 153.8125,
    "ha" : 157,
    "o" : "m -137 353 b -129 355 -134 353 -132 355 b -102 333 -118 355 -111 348 b -8 129 -63 273 -32 205 b 0 106 -4 116 -1 106 b 6 129 0 106 2 116 b 100 333 31 205 62 273 b 114 349 107 344 108 347 b 127 353 118 352 123 353 b 153 327 141 353 153 344 b 144 302 153 320 153 317 b 29 18 96 227 54 123 l 25 -4 b -1 -26 21 -19 13 -26 b -27 -4 -14 -26 -23 -19 l -31 18 b -145 302 -55 123 -98 227 b -155 327 -155 317 -155 320 b -137 353 -155 340 -148 349 "
  };

  // use square breve glyph instead of VexFlow's ||O||
  Vex.Flow.durationToGlyph.duration_codes['1/2'].type.n = {code_head : "noteheadDoubleWholeSquare"};

  //fallback: remove when the CMN long is implemented in VexFlow
  if (!Vex.Flow.durationToTicks.durations['1/4']) {
    Vex.Flow.durationToTicks.durations['1/4'] = Vex.Flow.RESOLUTION / 0.25;
  }

  // fallback: remove when the CMN long is implemented in VexFlow
  if (!Vex.Flow.durationToGlyph.duration_codes['1/4']) {
    Vex.Flow.durationToGlyph.duration_codes['1/4'] = {
      common : {
        head_width : 22,
        stem : false,
        stem_offset : 0,
        flag : false,
        stem_up_extension : -Vex.Flow.STEM_HEIGHT,
        stem_down_extension : -Vex.Flow.STEM_HEIGHT,
        gracenote_stem_up_extension : -Vex.Flow.STEM_HEIGHT,
        gracenote_stem_down_extension : -Vex.Flow.STEM_HEIGHT,
        tabnote_stem_up_extension : -Vex.Flow.STEM_HEIGHT,
        tabnote_stem_down_extension : -Vex.Flow.STEM_HEIGHT,
        dot_shiftY : 0,
        line_above : 0,
        line_below : 0
      }, type : {
        "n" : { // Longa note
          code_head : "noteheadCMNLonga"
        }, // the following shapes are not supported with longas
        "h" : { // Breve note harmonic
          code_head : "v59"
        }, "m" : { // Breve note muted -
          code_head : "vf", stem_offset : 0
        }, "r" : { // Breve rest
          code_head : "v31", head_width : 24, rest : true, position : "B/5", dot_shiftY : 0.5
        }, "s" : { // Breve note slash -
          // Drawn with canvas primitives
          head_width : 15, position : "B/4"
        }
      }
    };
  }

  Vex.Flow.Font.glyphs["noteheadDoubleWholeSquare"] = {
    "x_min" : 0,
    "x_max" : 746,
    "ha" : 746,
    "o" : "0 0 117 0 1 1 560 560 1 -1 0 -1120 m 724 350 b 746 328 736 350 746 340 l 746 -328 b 724 -350 746 -339 736 -350 b 701 -328 711 -350 701 -339 l 701 -270 b 659 -234 701 -253 683 -234 l 83 -234 b 45 -276 67 -234 45 -256 l 45 -328 b 22 -350 45 -339 35 -350 b 0 -328 10 -350 0 -339 l 0 328 b 22 350 0 340 10 350 b 45 328 35 350 45 340 l 45 260 b 77 218 45 260 64 218 l 659 218 b 701 265 679 218 701 232 l 701 328 b 724 350 701 340 711 350 m 45 18 l 45 -36 b 146 -94 45 -70 83 -94 l 606 -94 b 701 -36 664 -94 701 -77 l 701 28 b 606 78 701 57 664 78 l 139 78 b 45 18 71 78 45 59 "
  };
  // NOT PART OF BRAVURA:
  Vex.Flow.Font.glyphs["noteheadCMNLonga"] = {
    "x_min" : 0, "x_max" : 746, "ha" : 746, // based on the Bravura breve glyph; CHANGES: all values < -1400
    "o" : "0 0 117 0 1 1 560 560 1 -1 0 -1120 " + "m 724 350 " + "b 746 328 736 350 746 340 " + "l 746 -1428 " +
          "b 724 -1450 746 -1439 736 -1450 " + "b 701 -1428 711 -1450 701 -1439 " + "l 701 -270 " +
          "b 659 -234 701 -253 683 -234 " + "l 83 -234 " + "b 45 -276 67 -234 45 -256 " + "l 45 -328 " +
          "b 22 -350 45 -339 35 -350 " + "b 0 -328 10 -350 0 -339 " + "l 0 328 " + "b 22 350 0 340 10 350 " +
          "b 45 328 35 350 45 340 " + "l 45 260 " + "b 77 218 45 260 64 218 " + "l 659 218 " +
          "b 701 265 679 218 701 232 " + "l 701 328 " + "b 724 350 701 340 711 350 " + "m 45 18 " + "l 45 -36 " +
          "b 146 -94 45 -70 83 -94 " + "l 606 -94 " + "b 701 -36 664 -94 701 -77 " + "l 701 28 " +
          "b 606 78 701 57 664 78 " + "l 139 78 " + "b 45 18 71 78 45 59 "
  };


/**
 * Modifications:
 * 1) added conditions in draw() to align notes and create new slur only once. If the note
 * alignment function were called multiple times, the grace notes would get shifted further and
 * further each time draw() is called.
 */



  Vex.Flow.GraceNoteGroup.prototype.draw = function () {
    if (!this.context) {
      throw new Vex.RuntimeError("NoContext", "Can't draw Grace note without a context.");
    }

    var note = this.getNote();

    if (!(note && (this.index !== null))) {
      throw new Vex.RuntimeError("NoAttachedNote", "Can't draw grace note without a parent note and parent note index.");
    }

    function alignGraceNotesWithNote(grace_notes, note) {
      // Shift over the tick contexts of each note
      // So that th aligned with the note
      var tickContext = note.getTickContext();
      var extraPx = tickContext.getExtraPx();
      var x = tickContext.getX() - extraPx.left - extraPx.extraLeft;
      grace_notes.forEach(function (graceNote) {
        var tick_context = graceNote.getTickContext();
        var x_offset = tick_context.getX();
        graceNote.setStave(note.stave);
        tick_context.setX(x + x_offset);
      });
    }

    if (this.graceNotesAligned !== true) {
      alignGraceNotesWithNote(this.grace_notes, note);
      this.graceNotesAligned = true;
    }

    // Draw notes
    this.grace_notes.forEach(function (graceNote) {
      graceNote.setContext(this.context).draw();
    }, this);

    // Draw beam
    if (this.beam) {
      this.beam.setContext(this.context).draw();
    }

    if (this.show_slur) {
      if (!this.slur) {
        // Create and draw slur
        this.slur = new Vex.Flow.StaveTie({
          last_note : this.grace_notes[0],
          first_note : note,
          first_indices : [0],
          last_indices : [0]
        });
        this.slur.render_options.cp2 = 12;
      }
      this.slur.setContext(this.context).draw();
    }
  };





  /**
   * Create hyphens between the specified annotations.
   *
   * @constructor
   */
  Vex.Flow.Hyphen = ( function () {
    function Hyphen(config) {
      if (arguments.length > 0) {
        this.init(config);
      }
    }

    Hyphen.prototype = {
      init : function (config) {
        /**
         * config is a struct that has:
         *
         *  {
         *    first_annot: Annotation or any other object with an x (and optional
         * y) property,
         *    last_annot: Annotation or any other object with an x (and optional
         * y) property,
         *    NOTE: either first_annot or last_annot must have an y property
         *    (optional) max_hyphen_distance: the maximum distance between two
         * hyphens
         *    (optional) hyphen_width: the width of the hyphen character to draw
         *  }
         *
         **/

        this.max_hyphen_distance = config.max_hyphen_distance || 75;
        this.font = {
          family : "Arial",
          size : 10,
          style : ""
        };

        this.config = config;
        this.context = null;

      },

      setContext : function (context) {
        this.context = context;
        return this;
      },

      setFont : function (font) {
        this.font = font;
        return this;
      },

      renderHyphen : function () {
        var cfg = this.config;
        var ctx = this.context;
        var hyphen_width = cfg.hyphen_width || ctx.measureText('-').width;

        var first = cfg.first_annot;
        var last = cfg.last_annot;

        var start_x = (first.text) ? first.x + first.text_width : first.x;
        var end_x = last.x;

        var distance = end_x - start_x;

        if (distance > hyphen_width) {
          var y = (first.y && last.y) ? (first.y + last.y) / 2 : first.y || last.y;
          var hyphen_count = Math.ceil(distance / this.max_hyphen_distance);
          var single_width = distance / (hyphen_count + 1);
          while (hyphen_count--) {
            start_x += single_width;
            ctx.fillText('-', start_x - hyphen_width / 2, y);
          }
        }
      },

      draw : function () {
        if (!this.context) {
          throw new Vex.RERR("NoContext", "No context to render hyphens.");
        }
        var ctx = this.context;
        ctx.save();
        ctx.setFont(this.font.family, this.font.size, this.font.style);
        this.renderHyphen();
        ctx.restore();
        return true;
      }
    };

    return Hyphen;
  }());








  // [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
  // Author: Cyril Silverman
  //
  // ## Description
  //
  // This file implements key signatures. A key signature sits on a stave
  // and indicates the notes with implicit accidentals.
  Vex.Flow.KeySignature = (function () {
    // MODIFIED: ADDED PARAMETER
    function KeySignature(keySpec, customPadding) {
      // MODIFIED: ADDED PARAMETER
      if (arguments.length > 0) this.init(keySpec, customPadding);
    }

    // Space between natural and following accidental depending
    // on vertical position
    KeySignature.accidentalSpacing = {
      '#' : {
        above : 6,
        below : 4
      },
      'b' : {
        above : 4,
        below : 7
      },
      'n' : {
        above : 3,
        below : -1
      }
    };

    // ## Prototype Methods
    Vex.Inherit(KeySignature, Vex.Flow.StaveModifier, {
      // Create a new Key Signature based on a `key_spec`
      // MODIFIED: ADDED PARAMETER
      init : function (key_spec, customPadding) {
        KeySignature.superclass.init();

        // MODIFIED: added 2 lines
        var padding = customPadding || 10;
        this.setPadding(padding);

        this.glyphFontScale = 38; // TODO(0xFE): Should this match StaveNote?
        this.accList = Vex.Flow.keySignature(key_spec);
      },

      // Add an accidental glyph to the `stave`. `acc` is the data of the
      // accidental to add. If the `next` accidental is also provided, extra
      // width will be added to the initial accidental for optimal spacing.
      addAccToStave : function (stave, acc, next) {
        var glyph_data = Vex.Flow.accidentalCodes(acc.type);
        var glyph = new Vex.Flow.Glyph(glyph_data.code, this.glyphFontScale);

        // Determine spacing between current accidental and the next accidental
        var extra_width = 0;
        if (acc.type === "n" && next) {
          var above = next.line >= acc.line;
          var space = KeySignature.accidentalSpacing[next.type];
          extra_width = above ? space.above : space.below;
        }

        // Set the width and place the glyph on the stave
        glyph.setWidth(glyph_data.width + extra_width);
        this.placeGlyphOnLine(glyph, stave, acc.line);
        stave.addGlyph(glyph);
      },

      // Cancel out a key signature provided in the `spec` parameter. This will
      // place appropriate natural accidentals before the key signature.
      cancelKey : function (spec) {
        // Get the accidental list for the cancelled key signature
        var cancel_accList = Vex.Flow.keySignature(spec);

        // If the cancelled key has a different accidental type, ie: # vs b
        var different_types = this.accList.length > 0 && cancel_accList[0].type !== this.accList[0].type;

        // Determine how many naturals needed to add
        var naturals = 0;
        if (different_types) {
          naturals = cancel_accList.length;
        } else {
          naturals = cancel_accList.length - this.accList.length;
        }

        // Return if no naturals needed
        if (naturals < 1) return;

        // Get the line position for each natural
        var cancelled = [];
        for (var i = 0; i < naturals; i++) {
          var index = i;
          if (!different_types) {
            index = cancel_accList.length - naturals + i;
          }

          var acc = cancel_accList[index];
          cancelled.push({type : "n", line : acc.line});
        }

        // Combine naturals with main accidental list for the key signature
        this.accList = cancelled.concat(this.accList);

        return this;
      },

      // Add the key signature to the `stave`. You probably want to use the
      // helper method `.addToStave()` instead
      addModifier : function (stave) {
        this.convertAccLines(stave.clef, this.accList[0].type);
        for (var i = 0; i < this.accList.length; ++i) {
          this.addAccToStave(stave, this.accList[i], this.accList[i + 1]);
        }
      },

      // Add the key signature to the `stave`, if it's the not the `firstGlyph`
      // a spacer will be added as well.
      addToStave : function (stave, firstGlyph) {
        if (this.accList.length === 0) {
          return this;
        }

        if (!firstGlyph) {
          stave.addGlyph(this.makeSpacer(this.padding));
        }

        this.addModifier(stave);
        return this;
      },

      // Apply the accidental staff line placement based on the `clef` and
      // the  accidental `type` for the key signature ('# or 'b').
      convertAccLines : function (clef, type) {
        var offset = 0.0; // if clef === "treble"

        var sharps;
        var isTenorSharps = !!((clef === "tenor" || clef === 'subbass') && (type === "#"));
        var isSopranoSharps = !!((clef === 'soprano') && (type === "#"));
        var isBaritoneSharps = !!((clef === 'baritone-f' || clef === 'baritone-c') && (type === "#"));


        var isSopranoFlats = !!((clef === 'soprano' || clef === 'baritone-c' || clef === 'baritone-f') &&
                                (type === "b"));
        var isMezzoSopranoFlats = !!((clef === 'mezzo-soprano') && (type === "b"));

        // no shift: treble
        // only shift: bass, french, alto
        // sequence flats:  (baritone-c, baritone-f, soprano), (mezzo-soprano)
        // sequence sharps: (baritone-c, baritone-f), (soprano), (tenor, subbass)
        // # tenor


        switch (clef) {
          case "bass":
            offset = 1;
            break;
          case 'french':
            offset = 1;
            break;
          case "alto":
            offset = 0.5;
            break;

          case "tenor":
            offset = -0.5;
            break;


          case 'mezzo-soprano':
            offset = 1.5;
            break;

          case 'soprano':
            offset = -1;
            break;

          case 'baritone-f':
            offset = -1.5;
            break;
          case 'baritone-c':
            offset = -1.5;
            break;
        }

        // Special-case for sharps
        var i;
        if (isTenorSharps) {
          sharps = [
            3.5,
            1.5,
            3,
            1,
            2.5,
            0.5,
            2
          ];
          for (i = 0; i < this.accList.length; ++i) {
            this.accList[i].line = sharps[i] + offset;
          }
        } else if (isSopranoSharps) {
          sharps = [
            3.5,
            5,
            3,
            4.5,
            2.5,
            4,
            2
          ];
          for (i = 0; i < this.accList.length; ++i) {
            this.accList[i].line = sharps[i] + offset;
          }
        } else if (isSopranoFlats) {
          sharps = [
            2,
            4,
            2.5,
            4.5,
            3,
            5,
            3.5
          ];
          for (i = 0; i < this.accList.length; ++i) {
            this.accList[i].line = sharps[i] + offset;
          }
        } else if (isMezzoSopranoFlats) {
          sharps = [
            2,
            0.5,
            -1,
            1,
            -0.5,
            1.5,
            0
          ];
          for (i = 0; i < this.accList.length; ++i) {
            this.accList[i].line = sharps[i] + offset;
          }
        } else if (isBaritoneSharps) {
          sharps = [
            3.5,
            1.5,
            3,
            1,
            2.5,
            4,
            2
          ];
          for (i = 0; i < this.accList.length; ++i) {
            this.accList[i].line = sharps[i] + offset;
          }
        } else {
          if (clef != "treble") {
            for (i = 0; i < this.accList.length; ++i) {
              this.accList[i].line += offset;
            }
          }
        }
      }
    });

    return KeySignature;
  }());


/**
 * Modifications:
 * 1) added top_text_line and bottom_text_line to state object
 */




  // [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
  //
  // ## Description
  //
  // This class implements various types of modifiers to notes (e.g. bends,
  // fingering positions etc.)

  Vex.Flow.ModifierContext = (function() {
    function ModifierContext() {
      // Current modifiers
      this.modifiers = {};

      // Formatting data.
      this.preFormatted = false;
      this.postFormatted = false;
      this.width = 0;
      this.spacing = 0;
      this.state = {
        left_shift: 0,
        right_shift: 0,
        text_line: 0,
        top_text_line : 0,
        bottom_text_line : 0
      };

      // Add new modifiers to this array. The ordering is significant -- lower
      // modifiers are formatted and rendered before higher ones.
      this.PREFORMAT = [
        Vex.Flow.StaveNote,
        Vex.Flow.Dot,
        Vex.Flow.FretHandFinger,
        Vex.Flow.Accidental,
        Vex.Flow.GraceNoteGroup,
        Vex.Flow.Stroke,
        Vex.Flow.StringNumber,
        Vex.Flow.Articulation,
        Vex.Flow.Ornament,
        Vex.Flow.Annotation,
        Vex.Flow.Bend,
        Vex.Flow.Vibrato
      ];

      // If post-formatting is required for an element, add it to this array.
      this.POSTFORMAT = [ Vex.Flow.StaveNote ];
    }

    // To enable logging for this class. Set `Vex.Flow.ModifierContext.DEBUG` to `true`.
    function L() { if (ModifierContext.DEBUG) Vex.L("Vex.Flow.ModifierContext", arguments); }

    ModifierContext.prototype = {
      addModifier: function(modifier) {
        var type = modifier.getCategory();
        if (!this.modifiers[type]) this.modifiers[type] = [];
        this.modifiers[type].push(modifier);
        modifier.setModifierContext(this);
        this.preFormatted = false;
        return this;
      },

      getModifiers: function(type) { return this.modifiers[type]; },
      getWidth: function() { return this.width; },
      getExtraLeftPx: function() { return this.state.left_shift; },
      getExtraRightPx: function() { return this.state.right_shift; },
      getState: function() { return this.state; },

      getMetrics: function() {
        if (!this.formatted) throw new Vex.RERR("UnformattedModifier",
          "Unformatted modifier has no metrics.");

        return {
          width: this.state.left_shift + this.state.right_shift + this.spacing,
          spacing: this.spacing,
          extra_left_px: this.state.left_shift,
          extra_right_px: this.state.right_shift
        };
      },

      preFormat: function() {
        if (this.preFormatted) return;
        this.PREFORMAT.forEach(function(modifier) {
          L("Preformatting ModifierContext: ", modifier.CATEGORY);
          modifier.format(this.getModifiers(modifier.CATEGORY), this.state, this);
        }, this);

        // Update width of this modifier context
        this.width = this.state.left_shift + this.state.right_shift;
        this.preFormatted = true;
      },

      postFormat: function() {
        if (this.postFormatted) return;
        this.POSTFORMAT.forEach(function(modifier) {
          L("Postformatting ModifierContext: ", modifier.CATEGORY);
          modifier.postFormat(this.getModifiers(modifier.CATEGORY), this);
        }, this);
      }
    };

    return ModifierContext;
  }());




  Vex.Flow.Ornament.prototype.setMeiElement = function (element) {
    this.meiElement = element;
    return this;
  };
  Vex.Flow.Ornament.prototype.getMeiElement = function () {
    return this.meiElement;
  };


  // ## Static Methods
  // Arrange ornaments inside `ModifierContext`
  Vex.Flow.Ornament.format = function(ornaments, state) {
    if (!ornaments || ornaments.length === 0) return false;

    var text_line = state.text_line;
    var top_text_line = state.top_text_line;
    var bottom_text_line = state.bottom_text_line;
    var max_width = 0;

    // Format Articulations
    var width;
    for (var i = 0; i < ornaments.length; ++i) {
      var ornament = ornaments[i];

      var type = Vex.Flow.ornamentCodes(ornament.type);

      if (ornament.position === 3) {
        ornament.setTextLine(top_text_line);
        top_text_line += (type.between_lines) ? 1 : 1.5;
      } else if (ornament.position=== 4) {
        ornament.setTextLine(bottom_text_line);
        bottom_text_line += (type.between_lines) ? 1 : 1.5;
      } else {
        ornament.setTextLine(text_line);
        text_line += (type.between_lines) ? 1 : 1.5;
      }

      width = ornament.getWidth() > max_width ?
              ornament.getWidth() : max_width;
    }

    state.left_shift += width / 2;
    state.right_shift += width / 2;

    state.text_line = text_line;
    state.top_text_line = top_text_line;
    state.bottom_text_line = bottom_text_line;

    return true;
  };


  Vex.Flow.Ornament.prototype.draw = function () {
    if (!this.context) throw new Vex.RERR("NoContext", "Can't draw Ornament without a context.");
    if (!(this.note && (this.index !== null))) {
      throw new Vex.RERR("NoAttachedNote", "Can't draw Ornament without a note and index.");
    }

    var ctx = this.context;
    var stem_direction = this.note.getStemDirection();
    var stave = this.note.getStave();

    // TODO support bottom ornaments

    // Get stem extents
    var stem_ext = this.note.getStem().getExtents();
    var top, bottom;
    if (stem_direction === Vex.Flow.StaveNote.STEM_DOWN) {
      top = stem_ext.baseY;
      //bottom = stem_ext.topY;
    } else {
      top = stem_ext.topY;
      //bottom = stem_ext.baseY;
    }

    // TabNotes don't have stems attached to them. Tab stems are rendered
    // outside the stave.
    var is_tabnote = this.note.getCategory() === 'tabnotes';
    if (is_tabnote) {
      if (this.note.hasStem()) {
        if (stem_direction === Vex.Flow.StaveNote.STEM_UP) {
          //bottom = stave.getYForBottomText(this.text_line - 2);
        } else if (stem_direction === Vex.Flow.StaveNote.STEM_DOWN) {
          top = stave.getYForTopText(this.text_line - 1.5);
        }
      } else { // Without a stem
        top = stave.getYForTopText(this.text_line - 1);
        //bottom = stave.getYForBottomText(this.text_line - 2);
      }
    }

    var is_on_head = stem_direction === Vex.Flow.StaveNote.STEM_DOWN;
    var spacing = stave.getSpacingBetweenLines();
    var line_spacing = 1;

    // Beamed stems are longer than quarter note stems, adjust accordingly
    if (!is_on_head && this.note.beam) {
      line_spacing += 0.5;
    }

    var total_spacing = spacing * (this.text_line + line_spacing);
    var glyph_y_between_lines = (top - 7) - total_spacing;

    // Get initial coordinates for the modifier position
    var start = this.note.getModifierStartXY(this.position, this.index);
    var glyph_x = start.x + this.ornament.shift_right;
    var glyph_y = Math.min(stave.getYForTopText(this.text_line) - 3, glyph_y_between_lines);
    glyph_y += this.ornament.shift_up + this.y_shift;

    // Ajdust x position if ornament is delayed
    if (this.delayed) {
      glyph_x += this.ornament.width;
      var next_context = Vex.Flow.TickContext.getNextContext(this.note.getTickContext());
      if (next_context) {
        glyph_x += (next_context.getX() - glyph_x) * 0.5;
      } else {
        glyph_x += (stave.x + stave.width - glyph_x) * 0.5;
      }
    }

    var ornament = this;

    function drawAccidental(ctx, code, upper) {
      var acc_mods = {
        "n" : {
          shift_x : 1,
          shift_y_upper : 0,
          shift_y_lower : 0,
          height : 17
        },
        "#" : {
          shift_x : 0,
          shift_y_upper : -2,
          shift_y_lower : -2,
          height : 20
        },
        "b" : {
          shift_x : 1,
          shift_y_upper : 0,
          shift_y_lower : 3,
          height : 18
        },
        "##" : {
          shift_x : 0,
          shift_y_upper : 0,
          shift_y_lower : 0,
          height : 12
        },
        "bb" : {
          shift_x : 0,
          shift_y_upper : 0,
          shift_y_lower : 4,
          height : 17
        },
        "db" : {
          shift_x : -3,
          shift_y_upper : 0,
          shift_y_lower : 4,
          height : 17
        },
        "bbs" : {
          shift_x : 0,
          shift_y_upper : 0,
          shift_y_lower : 4,
          height : 17
        },
        "d" : {
          shift_x : 0,
          shift_y_upper : 0,
          shift_y_lower : 0,
          height : 17
        },
        "++" : {
          shift_x : -2,
          shift_y_upper : -6,
          shift_y_lower : -3,
          height : 22
        },
        "+" : {
          shift_x : 1,
          shift_y_upper : -4,
          shift_y_lower : -2,
          height : 20
        }
      };

      var accidental = Vex.Flow.accidentalCodes(code);

      var acc_x = glyph_x - 3;
      var acc_y = glyph_y + 2;

      var mods = acc_mods[code];

      // Special adjustments for trill glyph
      if (upper) {
        acc_y -= mods ? mods.height : 18;
        acc_y += ornament.type === "tr" ? -8 : 0;
      } else {
        acc_y += ornament.type === "tr" ? -6 : 0;
      }

      // Fine tune position of accidental glyph
      if (mods) {
        acc_x += mods.shift_x;
        acc_y += upper ? mods.shift_y_upper : mods.shift_y_lower;
      }

      // Render the glyph
      var scale = ornament.render_options.font_scale / 1.3;
      Vex.Flow.renderGlyph(ctx, acc_x, acc_y, scale, accidental.code);

      // If rendered a bottom accidental, increase the y value by the
      // accidental height so that the ornament's glyph is shifted up
      if (!upper) {
        glyph_y -= mods ? mods.height : 18;
      }
    }

    // Draw lower accidental for ornament
    if (this.accidental_lower) {
      drawAccidental(ctx, this.accidental_lower, false, glyph_x, glyph_y);
    }

    Vex.Flow.renderGlyph(ctx, glyph_x, glyph_y, this.render_options.font_scale, this.ornament.code);

    // ADDITION:
    this.x = glyph_x;
    this.y = glyph_y;

    // Draw upper accidental for ornament
    if (this.accidental_upper) {
      drawAccidental(ctx, this.accidental_upper, true, glyph_x, glyph_y);
    }

  };




  // Vex Flow
  // Mohit Muthanna <mohit@muthanna.com>
  //
  // Copyright Mohit Cheppudira 2010

  /** @constructor */
  Vex.Flow.Stave = (function () {
    function Stave(x, y, width, options) {
      if (arguments.length > 0) this.init(x, y, width, options);
    }

    var THICKNESS = (Vex.Flow.STAVE_LINE_THICKNESS > 1 ? Vex.Flow.STAVE_LINE_THICKNESS : 0);
    Stave.prototype = {
      init : function (x, y, width, options) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.start_x = this.getGlyphStartX();
        this.end_x = this.getGlyphEndX();
        this.context = null;
        this.glyphs = [];
        this.end_glyphs = [];
        this.modifiers = [];  // non-glyph stave items (barlines, coda, segno, etc.)
        this.measure = 0;
        this.clef = "treble";
        this.font = {
          family : "sans-serif",
          size : 8,
          weight : ""
        };
        this.options = {
          vertical_bar_width : 10,       // Width around vertical bar end-marker
          glyph_spacing_px : 10,
          num_lines : 5,
          fill_style : "#999999",
          spacing_between_lines_px : 10, // in pixels
          space_above_staff_ln : 4,      // in staff lines
          space_below_staff_ln : 4,      // in staff lines
          top_text_position : 1          // in staff lines
        };
        this.bounds = {x : this.x, y : this.y, w : this.width, h : 0};
        Vex.Merge(this.options, options);

        this.resetLines();

        this.modifiers.push(new Vex.Flow.Barline(Vex.Flow.Barline.type.SINGLE, this.x)); // beg bar
        this.modifiers.push(new Vex.Flow.Barline(Vex.Flow.Barline.type.SINGLE, this.x + this.width)); // end bar
      },

      getGlyphStartX : function () {
        return this.x + 5;
      },

      getGlyphEndX : function () {
        return this.x + this.width;
      },

      resetLines : function () {
        this.options.line_config = [];
        for (var i = 0; i < this.options.num_lines; i++) {
          this.options.line_config.push({visible : true});
        }
        this.height =
        (this.options.num_lines + this.options.space_above_staff_ln) * this.options.spacing_between_lines_px;
        this.options.bottom_text_position = this.options.num_lines + 1;
      },

      setNoteStartX : function (x) {
        this.start_x = x;
        return this;
      },
      getNoteStartX : function () {
        var start_x = this.start_x;

        // Add additional space if left barline is REPEAT_BEGIN and there are other
        // start modifiers than barlines
        if (this.modifiers[0].barline == Vex.Flow.Barline.type.REPEAT_BEGIN && this.modifiers.length > 2) {
          start_x += 20;
        }
        return start_x;
      },

      getNoteEndX : function () {
        return this.end_x;
      },
      getTieStartX : function () {
        return this.start_x;
      },
      getTieEndX : function () {
        return this.x + this.width;
      },
      setContext : function (context) {
        this.context = context;
        return this;
      },
      getContext : function () {
        return this.context;
      },

      setX : function (x) {
        var i;
        var dx = (typeof this.x == "number") ? x - this.x : 0;
        //      console.log('dx: ' + dx.toString());
        this.x = x;
        this.bounds.x = x;
        this.start_x += dx;
        for (i = 0; i < this.modifiers.length; i++) {
          this.modifiers[i].x = x;
        }
        return this;
      },

      getX : function () {
        return this.x;
      },
      getNumLines : function () {
        return this.options.num_lines;
      },
      setNumLines : function (lines) {
        this.options.num_lines = parseInt(lines, 10);
        this.resetLines();
        return this;
      },
      setY : function (y) {
        this.y = y;
        return this;
      },

      setWidth : function (width) {
        this.width = width;
        this.end_x = this.getGlyphEndX();

        // reset the x position of the end barline
        this.modifiers[1].setX(this.end_x);
        return this;
      },

      getWidth : function () {
        return this.width;
      },

      setMeasure : function (measure) {
        this.measure = measure;
        return this;
      },

      // Bar Line functions
      setBegBarType : function (type) {
        // Only valid bar types at beginning of stave is none, single or begin repeat
        if (type == Vex.Flow.Barline.type.SINGLE || type == Vex.Flow.Barline.type.REPEAT_BEGIN || type == Vex.Flow.Barline.type.NONE) {
          this.modifiers[0] = new Vex.Flow.Barline(type, this.x);
        }
        return this;
      },

      setEndBarType : function (type) {
        // Repeat end not valid at end of stave
        if (type != Vex.Flow.Barline.type.REPEAT_BEGIN) {
          this.modifiers[1] = new Vex.Flow.Barline(type, this.x + this.width);
        }
        return this;
      },

      /**
       * Gets the pixels to shift from the beginning of the stave
       * following the modifier at the provided index
       * @param  {Number} index The index from which to determine the shift
       * @return {Number}       The amount of pixels shifted
       */
      getModifierXShift : function (index) {
        if (typeof index === 'undefined') index = this.glyphs.length - 1;
        if (typeof index !== 'number') new Vex.RERR("InvalidIndex", "Must be of number type");

        var x = this.getGlyphStartX();
        var bar_x_shift = 0;

        for (var i = 0; i < index + 1; ++i) {
          var glyph = this.glyphs[i];
          x += glyph.getMetrics().width;
          bar_x_shift += glyph.getMetrics().width;
        }

        // Add padding after clef, time sig, key sig
        if (bar_x_shift > 0) bar_x_shift += this.options.vertical_bar_width + 10;

        return bar_x_shift;
      },

      // Coda & Segno Symbol functions
      setRepetitionTypeLeft : function (type, y) {
        this.modifiers.push(new Vex.Flow.Repetition(type, this.x, y));
        return this;
      },

      setRepetitionTypeRight : function (type, y) {
        this.modifiers.push(new Vex.Flow.Repetition(type, this.x, y));
        return this;
      },

      // Volta functions
      setVoltaType : function (type, number_t, y) {
        this.modifiers.push(new Vex.Flow.Volta(type, number_t, this.x, y));
        return this;
      },

      // Section functions
      setSection : function (section, y) {
        this.modifiers.push(new Vex.Flow.StaveSection(section, this.x, y));
        return this;
      },

      // Tempo functions
      setTempo : function (tempo, y) {
        this.modifiers.push(new Vex.Flow.StaveTempo(tempo, this.x, y));
        return this;
      },

      // Text functions
      setText : function (text, position, options) {
        this.modifiers.push(new Vex.Flow.StaveText(text, position, options));
        return this;
      },

      getHeight : function () {
        return this.height;
      },

      getSpacingBetweenLines : function () {
        return this.options.spacing_between_lines_px;
      },

      getBoundingBox : function () {
        return new Vex.Flow.BoundingBox(this.x, this.y, this.width, this.getBottomY() - this.y);
        // body...
      },

      getBottomY : function () {
        var options = this.options;
        var spacing = options.spacing_between_lines_px;

        return this.getYForLine(options.num_lines) + (options.space_below_staff_ln * spacing);
      },

      getBottomLineY : function () {
        return this.getYForLine(this.options.num_lines);
      },

      getYForLine : function (line) {
        var options = this.options;
        var spacing = options.spacing_between_lines_px;
        var headroom = options.space_above_staff_ln;

        return this.y + ((line * spacing) + (headroom * spacing)) - (THICKNESS / 2);
      },

      getYForTopText : function (line, font_scale) {
        var l = line || 0;
        var scale = font_scale || 1;
        return this.getYForLine(-(l * scale) - this.options.top_text_position);
      },

      getYForBottomText : function (line, font_scale) {
        var l = line || 0;
        var scale = font_scale || 1;
        return this.getYForLine(this.options.bottom_text_position + (l * scale));
      },

      getYForNote : function (line) {
        var options = this.options;
        var spacing = options.spacing_between_lines_px;
        var headroom = options.space_above_staff_ln;

        return this.y + (headroom * spacing) + (5 * spacing) - (line * spacing);
      },

      getYForGlyphs : function () {
        return this.getYForLine(3);
      },

      addGlyph : function (glyph) {
        glyph.setStave(this);
        this.glyphs.push(glyph);
        this.start_x += glyph.getMetrics().width;
        return this;
      },

      addEndGlyph : function (glyph) {
        glyph.setStave(this);
        this.end_glyphs.push(glyph);
        this.end_x -= glyph.getMetrics().width;
        return this;
      },

      addModifier : function (modifier) {
        this.modifiers.push(modifier);
        modifier.addToStave(this, (this.glyphs.length === 0));
        return this;
      },

      addEndModifier : function (modifier) {
        this.modifiers.push(modifier);
        modifier.addToStaveEnd(this, (this.end_glyphs.length === 0));
        return this;
      },

      addKeySignature : function (keySpec) {
        this.addModifier(new Vex.Flow.KeySignature(keySpec));
        return this;
      },

      addClef : function (clef, size, annotation) {
        this.clef = clef;
        this.addModifier(new Vex.Flow.Clef(clef, size, annotation));
        return this;
      },

      addEndClef : function (clef, size, annotation) {
        this.addEndModifier(new Vex.Flow.Clef(clef, size, annotation));
        return this;
      },

      addTimeSignature : function (timeSpec, customPadding) {
        this.addModifier(new Vex.Flow.TimeSignature(timeSpec, customPadding));
        return this;
      },

      addEndTimeSignature : function (timeSpec, customPadding) {
        this.addEndModifier(new Vex.Flow.TimeSignature(timeSpec, customPadding));
      },

      addTrebleGlyph : function () {
        this.clef = "treble";
        this.addGlyph(new Vex.Flow.Glyph("v83", 40));
        return this;
      },

      /**
       * All drawing functions below need the context to be set.
       */
      draw : function () {
        if (!this.context) throw new Vex.RERR("NoCanvasContext", "Can't draw stave without canvas context.");

        var num_lines = this.options.num_lines;
        var width = this.width;
        var x = this.x;
        var y;
        var glyph;

        // Render lines
        for (var line = 0; line < num_lines; line++) {
          y = this.getYForLine(line);

          this.context.save();
          this.context.setFillStyle(this.options.fill_style);
          this.context.setStrokeStyle(this.options.fill_style);
          if (this.options.line_config[line].visible) {
            this.context.fillRect(x, y, width, Vex.Flow.STAVE_LINE_THICKNESS);
          }
          this.context.restore();
        }

        // Render glyphs
        x = this.getGlyphStartX();
        for (var i = 0; i < this.glyphs.length; ++i) {
          glyph = this.glyphs[i];
          if (!glyph.getContext()) {
            glyph.setContext(this.context);
          }
          glyph.renderToStave(x);
          x += glyph.getMetrics().width;
        }

        // Render end glyphs
        x = this.getGlyphEndX();
        for (i = 0; i < this.end_glyphs.length; ++i) {
          glyph = this.end_glyphs[i];
          if (!glyph.getContext()) {
            glyph.setContext(this.context);
          }
          x -= glyph.getMetrics().width;
          glyph.renderToStave(x);
        }

        // Draw the modifiers (bar lines, coda, segno, repeat brackets, etc.)
        for (i = 0; i < this.modifiers.length; i++) {
          // Only draw modifier if it has a draw function
          if (typeof this.modifiers[i].draw == "function") {
            this.modifiers[i].draw(this, this.getModifierXShift());
          }
        }

        // Render measure numbers
        if (this.measure > 0) {
          this.context.save();
          this.context.setFont(this.font.family, this.font.size, this.font.weight);
          var text_width = this.context.measureText("" + this.measure).width;
          y = this.getYForTopText(0) + 3;
          this.context.fillText("" + this.measure, this.x - text_width / 2, y);
          this.context.restore();
        }

        return this;
      },

      // Draw Simple barlines for backward compatability
      // Do not delete - draws the beginning bar of the stave
      drawVertical : function (x, isDouble) {
        this.drawVerticalFixed(this.x + x, isDouble);
      },

      drawVerticalFixed : function (x, isDouble) {
        if (!this.context) throw new Vex.RERR("NoCanvasContext", "Can't draw stave without canvas context.");

        var top_line = this.getYForLine(0);
        var bottom_line = this.getYForLine(this.options.num_lines - 1);
        if (isDouble) {
          this.context.fillRect(x - 3, top_line, 1, bottom_line - top_line + 1);
        }
        this.context.fillRect(x, top_line, 1, bottom_line - top_line + 1);
      },

      drawVerticalBar : function (x) {
        this.drawVerticalBarFixed(this.x + x, false);
      },

      drawVerticalBarFixed : function (x) {
        if (!this.context) throw new Vex.RERR("NoCanvasContext", "Can't draw stave without canvas context.");

        var top_line = this.getYForLine(0);
        var bottom_line = this.getYForLine(this.options.num_lines - 1);
        this.context.fillRect(x, top_line, 1, bottom_line - top_line + 1);
      },

      /**
       * Get the current configuration for the Stave.
       * @return {Array} An array of configuration objects.
       */
      getConfigForLines : function () {
        return this.options.line_config;
      },

      /**
       * Configure properties of the lines in the Stave
       * @param line_number The index of the line to configure.
       * @param line_config An configuration object for the specified line.
       * @throws Vex.RERR "StaveConfigError" When the specified line number is out of
       *   range of the number of lines specified in the constructor.
       */
      setConfigForLine : function (line_number, line_config) {
        if (line_number >= this.options.num_lines || line_number < 0) {
          throw new Vex.RERR("StaveConfigError", "The line number must be within the range of the number of lines in the Stave.");
        }
        if (!line_config.hasOwnProperty('visible')) {
          throw new Vex.RERR("StaveConfigError", "The line configuration object is missing the 'visible' property.");
        }
        if (typeof(line_config.visible) !== 'boolean') {
          throw new Vex.RERR("StaveConfigError", "The line configuration objects 'visible' property must be true or false.");
        }

        this.options.line_config[line_number] = line_config;

        return this;
      },

      /**
       * Set the staff line configuration array for all of the lines at once.
       * @param lines_configuration An array of line configuration objects.  These objects
       *   are of the same format as the single one passed in to setLineConfiguration().
       *   The caller can set null for any line config entry if it is desired that the default be used
       * @throws Vex.RERR "StaveConfigError" When the lines_configuration array does not have
       *   exactly the same number of elements as the num_lines configuration object set in
       *   the constructor.
       */
      setConfigForLines : function (lines_configuration) {
        if (lines_configuration.length !== this.options.num_lines) {
          throw new Vex.RERR("StaveConfigError", "The length of the lines configuration array must match the number of lines in the Stave");
        }

        // Make sure the defaults are present in case an incomplete set of
        //  configuration options were supplied.
        for (var line_config in lines_configuration) {
          // Allow 'null' to be used if the caller just wants the default for a particular node.
          if (!lines_configuration[line_config]) {
            lines_configuration[line_config] = this.options.line_config[line_config];
          }
          Vex.Merge(this.options.line_config[line_config], lines_configuration[line_config]);
        }

        this.options.line_config = lines_configuration;

        return this;
      }
    };

    return Stave;
  }());





  // Vex Flow Notation
  // Implements key signatures
  //
  // Requires vex.js.

  Vex.Flow.StaveNote.prototype.getTieRightX = function () {
    var tieStartX = this.getAbsoluteX();
    tieStartX += this.glyph.head_width + this.x_shift + this.extraRightPx;
    //if (this.modifierContext) tieStartX += this.modifierContext.getExtraRightPx();
    return tieStartX;
  };

  Vex.Flow.StaveNote.prototype.getYForBottomText = function (text_line) {
    var extents = this.getStemExtents();
    return Vex.Max(this.stave.getYForBottomText(text_line), extents.baseY +
                                                            (this.render_options.annotation_spacing * (text_line + 1)));
  };


  // TODO modify to draw lines for whole/half rests outside of the staff system
//  // Draw the ledger lines between the stave and the highest/lowest keys
//  drawLedgerLines: function(){
//    if (this.isRest()) { return; }
//    if (!this.context) throw new Vex.RERR("NoCanvasContext",
//      "Can't draw without a canvas context.");
//    var ctx = this.context;
//
//    var bounds = this.getNoteHeadBounds();
//    var highest_line = bounds.highest_line;
//    var lowest_line = bounds.lowest_line;
//    var head_x = this.note_heads[0].getAbsoluteX();
//
//    var that = this;
//    function stroke(y) {
//      if (that.use_default_head_x === true)  {
//        head_x = that.getAbsoluteX() + that.x_shift;
//      }
//      var x = head_x - that.render_options.stroke_px;
//      var length = ((head_x + that.glyph.head_width) - head_x) +
//                   (that.render_options.stroke_px * 2);
//
//      ctx.fillRect(x, y, length, 1);
//    }
//
//    var line; // iterator
//    for (line = 6; line <= highest_line; ++line) {
//      stroke(this.stave.getYForNote(line));
//    }
//
//    for (line = 0; line >= lowest_line; --line) {
//      stroke(this.stave.getYForNote(line));
//    }
//  };


  Vex.Flow.StaveNote.prototype.draw = function() {
    if (!this.context) throw new Vex.RERR("NoCanvasContext",
      "Can't draw without a canvas context.");
    if (!this.stave) throw new Vex.RERR("NoStave",
      "Can't draw without a stave.");
    if (this.ys.length === 0) throw new Vex.RERR("NoYValues",
      "Can't draw note without Y values.");

    var x_begin = this.getNoteHeadBeginX();
    var x_end = this.getNoteHeadEndX();

    var render_stem = this.hasStem() && !this.beam;

    // Format note head x positions
    this.note_heads.forEach(function(note_head) {
      note_head.setX(x_begin);
    }, this);


    // Format stem x positions
    this.stem.setNoteHeadXBounds(x_begin, x_end);


    // Draw each part of the note
    this.drawLedgerLines();
    if (render_stem) this.drawStem();
    this.drawNoteHeads();
    this.drawFlag();
    this.drawModifiers();
  }



;
/**
 * Modifications:
 * 1) Added ctx.save() etc
 */



  // VexFlow - Music Engraving for HTML5
  // Copyright Mohit Muthanna 2010
  // This class by Raffaele Viglianti, 2012 http://itisnotsound.wordpress.com/
  //
  // This class implements hairpins between notes.
  // Hairpins can be either Crescendo or Descrescendo.

  /**
   * Create a new hairpin from the specified notes.
   *
   * @constructor
   * @param {!Object} notes The notes to tie up.
   * @param {!Object} type The type of hairpin
   */

  Vex.Flow.StaveHairpin = (function () {
    function StaveHairpin(notes, type) {
      if (arguments.length > 0) this.init(notes, type);
    }

    StaveHairpin.type = {
      CRESC : 1,
      DECRESC : 2
    };

    /* Helper function to convert ticks into pixels.
     * Requires a Formatter with voices joined and formatted (to
     * get pixels per tick)
     *
     * options is struct that has:
     *
     *  {
     *   height: px,
     *   y_shift: px, //vertical offset
     *   left_shift_ticks: 0, //left horizontal offset expressed in ticks
     *   right_shift_ticks: 0 // right horizontal offset expressed in ticks
     *  }
     *
     **/
    StaveHairpin.FormatByTicksAndDraw = function (ctx, formatter, notes, type, position, options) {
      var ppt = formatter.pixelsPerTick;

      if (ppt == null) {
        throw new Vex.RuntimeError("BadArguments", "A valid Formatter must be provide to draw offsets by ticks.");
      }

      var l_shift_px = ppt * options.left_shift_ticks;
      var r_shift_px = ppt * options.right_shift_ticks;

      var hairpin_options = {
        height : options.height,
        y_shift : options.y_shift,
        left_shift_px : l_shift_px,
        right_shift_px : r_shift_px};

      new StaveHairpin({
        first_note : notes.first_note,
        last_note : notes.last_note
      }, type).setContext(ctx).setRenderOptions(hairpin_options).setPosition(position).draw();
    };

    StaveHairpin.prototype = {

    setMeiElement : function (element) {
      this.meiElement = element;
      return this;
    },

    getMeiElement : function () {
      return this.meiElement;
    },


      init : function (notes, type) {
        /**
         * Notes is a struct that has:
         *
         *  {
       *    first_note: Note,
       *    last_note: Note,
       *  }
         *
         **/

        this.setNotes(notes);
        this.hairpin = type;
        this.position = Vex.Flow.Modifier.Position.BELOW;

        this.context = null;

        this.render_options = {
          height : 10,
          y_shift : 0, //vertical offset
          left_shift_px : 0, //left horizontal offset
          right_shift_px : 0 // right horizontal offset
        };

        this.setNotes(notes);
      },

      setContext : function (context) {
        this.context = context;
        return this;
      },

      setPosition : function (position) {
        if (position == Vex.Flow.Modifier.Position.ABOVE || position == Vex.Flow.Modifier.Position.BELOW) {
          this.position = position;
        }
        return this;
      },

      setRenderOptions : function (options) {
        if (options) {
          Vex.Merge(this.render_options, options);
        }
        return this;
      },

      /**
       * Set the notes to attach this hairpin to.
       *
       * @param {!Object} notes The start and end notes.
       */
      setNotes : function (notes) {
        if (!notes.first_note && !notes.last_note) {
          throw new Vex.RuntimeError("BadArguments", "Hairpin needs to have either first_note or last_note set.");
        }

        // Success. Lets grab 'em notes.
        this.first_note = notes.first_note;
        this.last_note = notes.last_note;
        return this;
      },

      renderHairpin : function (params) {
        var ctx = this.context;

        ctx.save();
        ctx.lineWidth = 1.3;
        ctx.beginPath();

        var dis = this.render_options.y_shift + 20;
        var y_shift = params.first_y;

        if (this.position == Vex.Flow.Modifier.Position.ABOVE) {
          dis = -dis + 30;
          y_shift = params.first_y - params.staff_height;
        }

        var l_shift = this.render_options.left_shift_px;
        var r_shift = this.render_options.right_shift_px;

        var x, x1, y, height;
        x = params.first_x + l_shift;
        x1 = params.last_x + r_shift;
        y = y_shift + dis;
        height = this.render_options.height;

        this.x = x;
        this.x1 = x1;
        this.y = y;
        this.height = height;

        var height_diff;

        switch (this.hairpin) {
          case StaveHairpin.type.CRESC:
            if (params.continued_left) {
              height_diff = height * 0.2;
              ctx.moveTo(x1 + l_shift, y);
              ctx.lineTo(x, y + height_diff);
              ctx.moveTo(x + l_shift,  y + height - height_diff);
              ctx.lineTo(x1, y + height);
            } else {
              ctx.moveTo(x1, y);
              ctx.lineTo(x, y + (height / 2));
              ctx.lineTo(x1, y + height);
            }
            break;
          case StaveHairpin.type.DECRESC:
            if (params.continued_right) {
              height_diff = height * 0.2;
              ctx.moveTo(x + l_shift, y);
              ctx.lineTo(x1, y + height_diff);
              ctx.moveTo(x1 + l_shift,  y + height - height_diff);
              ctx.lineTo(x, y + height);
            } else {
              ctx.moveTo(x + l_shift, y);
              ctx.lineTo(x1, y + (height / 2));
              ctx.lineTo(x, y + height);
            }
            break;
          default:
            // Default is NONE, so nothing to draw
            break;
        }

        ctx.stroke();
        ctx.restore();
      },

      draw : function () {
        if (!this.context) throw new Vex.RERR("NoContext", "Can't draw Hairpin without a context.");

        var first_note = this.first_note;
        var last_note = this.last_note;
        var start, end;

        if (first_note && last_note) {
          start = first_note.getModifierStartXY(this.position, 0);
          end = last_note.getModifierStartXY(this.position, 0);

          this.renderHairpin({
            first_x : start.x,
            last_x : end.x,
            first_y : first_note.getStave().y + first_note.getStave().height,
            // currently not in use:
//            last_y : last_note.getStave().y + last_note.getStave().height,
            staff_height : first_note.getStave().height,
            continued_left : false,
            continued_right : false
          });
          return true;
        } else if (first_note) {
          start = first_note.getModifierStartXY(this.position, 0);
          this.renderHairpin({
            first_x : start.x,
            last_x : first_note.getStave().getSlurEndX(),
            first_y : first_note.getStave().y + first_note.getStave().height,
            // currently not in use:
            //            last_y : last_note.getStave().y + last_note.getStave().height,
            staff_height : first_note.getStave().height,
            continued_left : false,
            continued_right : true
          });
          return true;

        } else {
          end = last_note.getModifierStartXY(this.position, 0);
          this.renderHairpin({
            first_x : last_note.getStave().getSlurStartX(),
            last_x : end.x,
            first_y : last_note.getStave().y + last_note.getStave().height,
            // currently not in use:
            //            last_y : last_note.getStave().y + last_note.getStave().height,
            staff_height : last_note.getStave().height,
            continued_left : true,
            continued_right : false
          });
        }

      }
    };
    return StaveHairpin;
  }());







  // VexFlow - Music Engraving for HTML5
  // Copyright Mohit Muthanna 2010
  //
  // This class implements varies types of ties between contiguous notes. The
  // ties include: regular ties, hammer ons, pull offs, and slides.

  /**
   * Create a new tie from the specified notes. The notes must
   * be part of the same line, and have the same duration (in ticks).
   *
   * @constructor
   * @param {!Object} context The canvas context.
   * @param {!Object} notes The notes to tie up.
   * @param {!Object} Options
   */
  Vex.Flow.StaveTie = ( function () {
    function StaveTie(notes, text) {
      if (arguments.length > 0) {
        this.init(notes, text);
      }
    }


    StaveTie.prototype = {
      init : function (notes, text) {
        /**
         * Notes is a struct that has:
         *
         *  {
         *    first_note: Note,
         *    last_note: Note,
         *    first_indices: [n1, n2, n3],
         *    last_indices: [n1, n2, n3]
         *  }
         *
         **/
        this.notes = notes;
        this.context = null;
        this.text = text;

        this.render_options = {
          cp1 : 8, // Curve control point 1
          cp2 : 12, // Curve control point 2
          text_shift_x : 0,
          first_x_shift : 0,
          last_x_shift : 0,
          y_shift : 7,
          tie_spacing : 0,
          font : {
            family : "Arial",
            size : 10,
            style : ""
          }
        };

        this.font = this.render_options.font;
        this.setNotes(notes);
      },

      setContext : function (context) {
        this.context = context;
        return this;
      },
      setFont : function (font) {
        this.font = font;
        return this;
      },

      /**
       * Set the notes to attach this tie to.
       *
       * @param {!Object} notes The notes to tie up.
       */
      setNotes : function (notes) {
        if (!notes.first_note && !notes.last_note) {
          throw new Vex.RuntimeError("BadArguments", "Tie needs to have either first_note or last_note set.");
        }

        if (!notes.first_indices) {
          notes.first_indices = [0];
        }
        if (!notes.last_indices) {
          notes.last_indices = [0];
        }

        if (notes.first_indices.length != notes.last_indices.length) {
          throw new Vex.RuntimeError("BadArguments", "Tied notes must have similar" + " index sizes");
        }

        // Success. Lets grab 'em notes.
        this.first_note = notes.first_note;
        this.first_indices = notes.first_indices;
        this.last_note = notes.last_note;
        this.last_indices = notes.last_indices;
        return this;
      },

      /**
       * @return {boolean} Returns true if this is a partial bar.
       */
      isPartial : function () {
        return (!this.first_note || !this.last_note);
      },

      // START ADDITION
      setDir : function (dir) {
        this.direction = dir;
      },

      getDir : function () {
        return this.direction;
      },
      // END ADDITION

      renderTie : function (params) {
        if (params.first_ys.length === 0 || params.last_ys.length === 0) {
          throw new Vex.RERR("BadArguments", "No Y-values to render");
        }

        var ctx = this.context;
        var cp1 = this.render_options.cp1;
        var cp2 = this.render_options.cp2;

        if (Math.abs(params.last_x_px - params.first_x_px) < 10) {
          cp1 = 2;
          cp2 = 8;
        }

        var first_x_shift = this.render_options.first_x_shift;
        var last_x_shift = this.render_options.last_x_shift;
        var y_shift = this.render_options.y_shift * params.direction;

        for (var i = 0; i < this.first_indices.length; ++i) {
          var cp_x = ((params.last_x_px + last_x_shift) + (params.first_x_px + first_x_shift)) / 2;
          var first_y_px = params.first_ys[this.first_indices[i]] + y_shift;
          var last_y_px = params.last_ys[this.last_indices[i]] + y_shift;

          if (isNaN(first_y_px) || isNaN(last_y_px)) {
            throw new Vex.RERR("BadArguments", "Bad indices for tie rendering.");
          }

          var top_cp_y = ((first_y_px + last_y_px) / 2) + (cp1 * params.direction);
          var bottom_cp_y = ((first_y_px + last_y_px) / 2) + (cp2 * params.direction);

          ctx.beginPath();
          ctx.moveTo(params.first_x_px + first_x_shift, first_y_px);
          ctx.quadraticCurveTo(cp_x, top_cp_y, params.last_x_px + last_x_shift, last_y_px);
          ctx.quadraticCurveTo(cp_x, bottom_cp_y, params.first_x_px + first_x_shift, first_y_px);

          ctx.closePath();
          ctx.fill();
        }
      },

      renderText : function (first_x_px, last_x_px) {
        if (!this.text) {
          return;
        }
        var center_x = (first_x_px + last_x_px) / 2;
        center_x -= this.context.measureText(this.text).width / 2;

        this.context.save();
        this.context.setFont(this.font.family, this.font.size, this.font.style);
        this.context.fillText(this.text, center_x + this.render_options.text_shift_x, (this.first_note ||
                                                                                       this.last_note).getStave().getYForTopText() -
                                                                                      1);
        this.context.restore();
      },

      draw : function () {
        if (!this.context) {
          throw new Vex.RERR("NoContext", "No context to render tie.");
        }
        var first_note = this.first_note;
        var last_note = this.last_note;
        var first_x_px, last_x_px, first_ys, last_ys, stem_direction;

        if (first_note) {
          first_x_px = first_note.getTieRightX() + this.render_options.tie_spacing;
          stem_direction = first_note.getStemDirection();
          first_ys = first_note.getYs();
        } else {
          first_x_px = last_note.getStave().getTieStartX();
          first_ys = last_note.getYs();
          this.first_indices = this.last_indices;
        }

        if (last_note) {
          last_x_px = last_note.getTieLeftX() + this.render_options.tie_spacing;
          stem_direction = last_note.getStemDirection();
          last_ys = last_note.getYs();
        } else {
          last_x_px = first_note.getStave().getTieEndX();
          last_ys = first_note.getYs();
          this.last_indices = this.first_indices;
        }

        // START MODIFICATION
        if (!this.direction) {
          this.direction = stem_direction;
        }

        this.renderTie({
          first_x_px : first_x_px,
          last_x_px : last_x_px,
          first_ys : first_ys,
          last_ys : last_ys,
          direction : this.direction
        });
        // END MODIFICATION

        this.renderText(first_x_px, last_x_px);
        return true;
      }
    };

    return StaveTie;
  }());



/**
 * Changes:
 * 1) set volta start x to measure start even if it's not the first stave modifier (e.g. when
 * a new system starts with a volta
 */



  Vex.Flow.Volta.prototype.draw = function (stave, x) {

    x-=stave.getModifierXShift();

    var Volta = Vex.Flow.Volta;

    if (!stave.context) throw new Vex.RERR("NoCanvasContext", "Can't draw stave without canvas context.");
    var ctx = stave.context;
    var width = stave.width;
    var top_y = stave.getYForTopText(stave.options.num_lines) + this.y_shift;
    var vert_height = 1.5 * stave.options.spacing_between_lines_px;
    switch (this.volta) {
      case Vex.Flow.Volta.type.BEGIN:
        ctx.fillRect(this.x + x, top_y, 1, vert_height);
        break;
      case Vex.Flow.Volta.type.END:
        width -= 5;
        ctx.fillRect(this.x + x + width, top_y, 1, vert_height);
        break;
      case Vex.Flow.Volta.type.BEGIN_END:
        width -= 3;
        ctx.fillRect(this.x + x, top_y, 1, vert_height);
        ctx.fillRect(this.x + x + width, top_y, 1, vert_height);
        break;
    }
    // If the beginning of a volta, draw measure number
    if (this.volta == Volta.type.BEGIN || this.volta == Volta.type.BEGIN_END) {
      ctx.save();
      ctx.setFont(this.font.family, this.font.size, this.font.weight);
      ctx.fillText(this.number, this.x + x + 5, top_y + 15);
      ctx.restore();
    }
    ctx.fillRect(this.x + x, top_y, width, 1);
    return this;
  };



/**
 * Modifications:
 * 1) added arrow-less ROLL stroke type
 */

/**
 * VexFlow extension to support tremolos not only on down- but also on up-stems
 */



  // [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
  // Author: Larry Kuhns
  //
  // ## Description
  //
  // This file implements the `Stroke` class which renders chord strokes
  // that can be arpeggiated, brushed, rasquedo, etc.

  Vex.Flow.Stroke = (function () {
    function Stroke(type, options) {
      if (arguments.length > 0) this.init(type, options);
    }

    Stroke.CATEGORY = "strokes";

    Stroke.Type = {
      ROLL : 0,
      BRUSH_DOWN : 1,
      BRUSH_UP : 2,
      ROLL_DOWN : 3,        // Arpegiated chord
      ROLL_UP : 4,          // Arpegiated chord
      RASQUEDO_DOWN : 5,
      RASQUEDO_UP : 6
    };

    var Modifier = Vex.Flow.Modifier;

    // ## Static Methods

    // Arrange strokes inside `ModifierContext`
    Stroke.format = function (strokes, state) {
      var left_shift = state.left_shift;
      var stroke_spacing = 0;

      if (!strokes || strokes.length === 0) return this;

      var str_list = [];
      var i, str, shift;
      for (i = 0; i < strokes.length; ++i) {
        str = strokes[i];
        var note = str.getNote();
        var props;
        if (note instanceof Vex.Flow.StaveNote) {
          props = note.getKeyProps()[str.getIndex()];
          shift = (props.displaced ? note.getExtraLeftPx() : 0);
          str_list.push({ line : props.line, shift : shift, str : str });
        } else {
          props = note.getPositions()[str.getIndex()];
          str_list.push({ line : props.str, shift : 0, str : str });
        }
      }

      var str_shift = left_shift;
      var x_shift = 0;

      // There can only be one stroke .. if more than one, they overlay each other
      for (i = 0; i < str_list.length; ++i) {
        str = str_list[i].str;
        shift = str_list[i].shift;

        str.setXShift(str_shift + shift);
        x_shift = Math.max(str.getWidth() + stroke_spacing, x_shift);
      }

      state.left_shift += x_shift;
      return true;
    };

    // ## Prototype Methods
    Vex.Inherit(Stroke, Modifier, {
      init : function (type, options) {
        Stroke.superclass.init.call(this);

        this.note = null;
        this.options = Vex.Merge({}, options);

        // multi voice - span stroke across all voices if true
        this.all_voices = 'all_voices' in this.options ? this.options.all_voices : true;

        // multi voice - end note of stroke, set in draw()
        this.note_end = null;
        this.index = null;
        this.type = type;
        this.position = Modifier.Position.LEFT;

        this.render_options = {
          font_scale : 38,
          stroke_px : 3,
          stroke_spacing : 10
        };

        this.font = {
          family : "serif",
          size : 10,
          weight : "bold italic"
        };

        this.setXShift(0);
        this.setWidth(10);
      },

      getPosition : function () {
        return this.position;
      },
      addEndNote : function (note) {
        this.note_end = note;
        return this;
      },

      draw : function () {
        if (!this.context) throw new Vex.RERR("NoContext", "Can't draw stroke without a context.");
        if (!(this.note && (this.index != null))) {
          throw new Vex.RERR("NoAttachedNote", "Can't draw stroke without a note and index.");
        }
        var start = this.note.getModifierStartXY(this.position, this.index);
        var ys = this.note.getYs();
        var topY = start.y;
        var botY = start.y;
        var x = start.x - 5;
        var line_space = this.note.stave.options.spacing_between_lines_px;

        var notes = this.getModifierContext().getModifiers(this.note.getCategory());
        var i;
        for (i = 0; i < notes.length; i++) {
          ys = notes[i].getYs();
          for (var n = 0; n < ys.length; n++) {
            if (this.note == notes[i] || this.all_voices) {
              topY = Vex.Min(topY, ys[n]);
              botY = Vex.Max(botY, ys[n]);
            }
          }
        }

        var arrow, arrow_shift_x, arrow_y, text_shift_x, text_y;
        switch (this.type) {
          case Stroke.Type.BRUSH_DOWN:
            arrow = "vc3";
            arrow_shift_x = -3;
            arrow_y = topY - (line_space / 2) + 10;
            botY += (line_space / 2);
            break;
          case Stroke.Type.BRUSH_UP:
            arrow = "v11";
            arrow_shift_x = 0.5;
            arrow_y = botY + (line_space / 2);
            topY -= (line_space / 2);
            break;
          case Stroke.Type.ROLL:
            topY += (line_space / 2);
            if (this.note instanceof Vex.Flow.StaveNote && (botY - topY) % 2 !== 0) {
              botY += 0.5 * line_space;
            } else {
              botY += line_space;
            }
            break;
          case Stroke.Type.ROLL_DOWN:
          case Stroke.Type.RASQUEDO_DOWN:
            arrow = "vc3";
            arrow_shift_x = -3;
            text_shift_x = this.x_shift + arrow_shift_x - 2;
            if (this.note instanceof Vex.Flow.StaveNote) {
              topY += 1.5 * line_space;
              if ((botY - topY) % 2 !== 0) {
                botY += 0.5 * line_space;
              } else {
                botY += line_space;
              }
              arrow_y = topY - line_space;
              text_y = botY + line_space + 2;
            } else {
              topY += 1.5 * line_space;
              botY += line_space;
              arrow_y = topY - 0.75 * line_space;
              text_y = botY + 0.25 * line_space;
            }
            break;
          case Stroke.Type.ROLL_UP:
          case Stroke.Type.RASQUEDO_UP:
            arrow = "v52";
            arrow_shift_x = -4;
            text_shift_x = this.x_shift + arrow_shift_x - 1;
            if (this.note instanceof Vex.Flow.StaveNote) {
              arrow_y = line_space / 2;
              topY += 0.5 * line_space;
              if ((botY - topY) % 2 === 0) {
                botY += line_space / 2;
              }
              arrow_y = botY + 0.5 * line_space;
              text_y = topY - 1.25 * line_space;
            } else {
              topY += 0.25 * line_space;
              botY += 0.5 * line_space;
              arrow_y = botY + 0.25 * line_space;
              text_y = topY - line_space;
            }
            break;
        }

        // Draw the stroke
        if (this.type == Stroke.Type.BRUSH_DOWN || this.type == Stroke.Type.BRUSH_UP) {
          this.context.fillRect(x + this.x_shift, topY, 1, botY - topY);
        } else {
          if (this.note instanceof Vex.Flow.StaveNote) {
            for (i = topY; i <= botY; i += line_space) {
              Vex.Flow.renderGlyph(this.context, x + this.x_shift - 4, i, this.render_options.font_scale, "va3");
            }
          } else {
            for (i = topY; i <= botY; i += 10) {
              Vex.Flow.renderGlyph(this.context, x + this.x_shift - 4, i, this.render_options.font_scale, "va3");
            }
            if (this.type == Vex.Flow.Stroke.Type.RASQUEDO_DOWN) {
              text_y = i + 0.25 * line_space;
            }
          }
        }

        // Draw the arrow head
        if (this.type !== Stroke.Type.ROLL) {
          Vex.Flow.renderGlyph(this.context, x + this.x_shift +
                                             arrow_shift_x, arrow_y, this.render_options.font_scale, arrow);
        }

        // Draw the rasquedo "R"
        if (this.type == Stroke.Type.RASQUEDO_DOWN || this.type == Stroke.Type.RASQUEDO_UP) {
          this.context.save();
          this.context.setFont(this.font.family, this.font.size, this.font.weight);
          this.context.fillText("R", x + text_shift_x, text_y);
          this.context.restore();
        }
      }
    });

    return Stroke;
  }());


/**
 * VexFlow extension to support tremolos not only on down- but also on up-stems
 */



  Vex.Flow.Tremolo.prototype.draw = function () {
    if (!this.context) throw new Vex.RERR("NoContext", "Can't draw Tremolo without a context.");
    if (!(this.note && (this.index != null))) {
      throw new Vex.RERR("NoAttachedNote", "Can't draw Tremolo without a note and index.");
    }


    var stem = this.note.getStem();

    var start, x, y;

    if (this.note.duration === 'w') {
      x = (stem.x_end + stem.x_begin) / 2;
      if (stem.stem_direction === 1) {
        y = stem.getExtents().topY - (this.y_spacing * this.num / 2) + stem.stem_extension;
      } else {
        start = this.note.getModifierStartXY(this.position, this.index);
        y = start.y;
      }
    } else if (stem.stem_direction === 1) {
      x = stem.x_end;
      y = stem.getExtents().topY - (this.y_spacing * this.num / 2);
    } else {
      start = this.note.getModifierStartXY(this.position, this.index);
      x = start.x; // or stem.x_begin
      y = start.y;
    }

    x += this.shift_right;
    for (var i = 0; i < this.num; ++i) {
      Vex.Flow.renderGlyph(this.context, x, y, this.render_options.font_scale, this.code);
      y += this.y_spacing;
    }
  };


;


  if (!window.MeiLib) window.MeiLib = {};

  /**
   * @class RuntimeError
   *
   * @constructor
   * @param {String} errorcode
   * @param {String} message
   */
  MeiLib.RuntimeError = function (errorcode, message) {
    this.errorcode = errorcode;
    this.message = message;
  };
  /**
   * @method toString
   * @return {String} the string representation of the error
   */
  MeiLib.RuntimeError.prototype.toString = function () {
    return 'MeiLib.RuntimeError: ' + this.errorcode + ': ' + this.message ? this.message : "";
  };
  /**
   * @class MeiLib
   * @singleton
   */;


  if (!window.MeiLib) window.MeiLib = {};

  /**
   * @class MeiLib.EventEnumerator
   * Enumerate over the children events of node (node is a layer, beam or tuplet).
   * @constructor
   * @param {Object} node an XML DOM object
   * @param {Object} proportion
   */
  MeiLib.EventEnumerator = function (node, proportion) {
    this.init(node, proportion);
  };
  /**
   * @method init
   * @param {Node} node
   * @param {Object} proportion
   */
  MeiLib.EventEnumerator.prototype.init = function (node, proportion) {
    if (!node) {
      throw new MeiLib.RuntimeError('MeiLib.EventEnumerator.init():E01', 'node is null or undefined');
    }
    this.node = node;
    this.next_evnt = null;
    // false if and only if next_evnt is valid.
    this.EoI = true;
    this.children = this.node.childNodes;
    this.i_next = -1;
    this.proportion = proportion || {
      num : 1,
      numbase : 1
    };
    this.outputProportion = proportion || {
      num : 1,
      numbase : 1
    };
    this.read_ahead();
  };
  /**
   * @method nextEvent
   * @public
   * @return
   */
  MeiLib.EventEnumerator.prototype.nextEvent = function () {
    if (!this.EoI) {
      var result = this.next_evnt;
      this.read_ahead();
      return result;
    }
    throw new MeiLib.RuntimeError('MeiLib.LayerEnum:E01', 'End of Input.')
  };

  /**
   * @method read_ahead
   * @private
   * @return
   */
  MeiLib.EventEnumerator.prototype.read_ahead = function () {
    if (this.beam_enumerator) {
      if (!this.beam_enumerator.EoI) {
        this.next_evnt = this.beam_enumerator.nextEvent();
        this.EoI = false;
      } else {
        this.EoI = true;
        this.beam_enumerator = null;
        this.step_ahead()
      }
    } else {
      this.step_ahead()
    }
  };

  /**
   * @method step_ahead
   * @private
   */
  MeiLib.EventEnumerator.prototype.step_ahead = function () {
    var end = false, i_next = this.i_next, children = this.children;

    while (!end) {
      ++i_next;
      if (i_next === children.length || children[i_next].nodeType === 1) {
        end = true;
      }
    }

    if (i_next < children.length) {
      this.next_evnt = children[i_next];
      var node_name = this.next_evnt.localName;
      if (node_name === 'note' || node_name === 'rest' || node_name === 'mRest' || node_name === 'chord') {
        this.EoI = false;
      } else if (node_name === 'beam') {
        this.beam_enumerator = new MeiLib.EventEnumerator(this.next_evnt);
        if (!this.beam_enumerator.EoI) {
          this.next_evnt = this.beam_enumerator.nextEvent();
          this.EoI = false;
        } else {
          this.EoI = true;
        }
      } else if (node_name === 'tuplet') {

        var proportion = {
          num : this.proportion.num * +this.next_evnt.getAttribute('num') || 3,
          numbase : this.proportion.numbase * +this.next_evnt.getAttribute('numbase') || 2
        };

        this.beam_enumerator = new MeiLib.EventEnumerator(this.next_evnt, proportion);
        if (!this.beam_enumerator.EoI) {
          this.outputProportion = this.beam_enumerator.outputProportion;
          this.next_evnt = this.beam_enumerator.nextEvent();
          this.EoI = false;
        } else {
          this.outputProportion = this.proportion;
          this.EoI = true;
        }
      }
    } else {
      this.EoI = true;
    }
    this.i_next = i_next;
  };


  if (!window.MeiLib) window.MeiLib = {};

  /**
   * @method SliceMEI
   * Returns a slice of the MEI. The slice is specified by the number of the
   * starting and ending measures.
   *
   * About the <code>staves</code> parameter: it specifies a list of staff
   * numbers. If it is defined, only the listed staves will be kept in the
   * resulting slice. The following elements will be removed from:
   *
   * 1. <b>staffDef</b> elements (@staff value is matched against the specified list)
   * 2. <b>staff</b> elements (@n value is matched against the specified list)
   * 3. any other child element of measures that has
   *
   * @staff specified AND it is not listed.
   *
   * Note that <b>staff</b> elements without @n will be removed.
   *
   * @param {Object} MEI
   * @param {Object} params like { start_n:NUMBER, end_n:NUMBER, noKey:BOOLEAN,
 *            noClef:BOOLEAN, noMeter:BOOLEAN, noConnectors, staves:[NUMBER] },
   *            where <code>noKey</code>, <code>noClef</code> and
   *            <code>noMeter</code> and <code>noConnectors</code> are
   *            optional. taves is optional. If staves is set, it is an array of
   *            staff numbers. Only the staves specified in the list will be
   *            included in the resulting MEI.
   * @return XML DOM object
   */
  MeiLib.SliceMEI = function (MEI, params) {

    var i, j;

    var setVisibles = function (elements, params) {
      var i, j, elem;
      for (i = 0, j = elements.length; i < j; i++) {
        elem = elements[i];
        if (params.noClef) {
          elem.setAttribute('clef.visible', 'false');
        }
        if (params.noKey) {
          elem.setAttribute('key.sig.show', 'false');
        }
        if (params.noMeter) {
          //MBO elem.setAttribute('meter.rend', 'false');
		  elem.setAttribute('meter.rend', 'invis');
        }
      }
    };

    /**
     * Keep or remove child from section depending whether it's inside the section or not.
     * If it's kept, remove unwanted staves
     */
    var keepOrRemove = function (elem, inside_slice, staffNSelector, params) {
      var i, j, staffElements, staffElement, n, removed = false;
      if (!inside_slice) {
        if (elem.localName === 'measure' && Number(elem.getAttribute('n')) === params.start_n) {
          inside_slice = true;
        } else {
          elem.parentNode.removeChild(elem);
          removed = true;
        }
      }

      if (inside_slice) {
        // remove unwanted staff
        if (params.staves && elem.nodeType === 1) {
//          $(elem).find('[staff]').remove(':not(' + staffNSelector + ')');

          var elementsToRemove = elem.querySelectorAll('[staff]' + staffNSelector);
          for (i= 0, j=elementsToRemove.length;i<j;i++){
            elementsToRemove[i].parentNode.removeChild(elementsToRemove[i]);
          }

          staffElements = elem.getElementsByTagName('staff');
          for (i = 0, j = staffElements.length; i < j; i++) {
            staffElement = staffElements[i];
            n = Number(staffElement.getAttribute('n'));
            if (params.staves.indexOf(n) === -1) {
              staffElement.parentNode.removeChild(staffElement);
              i--;
              j--;
            }
          }
        }

        // finish inside_slice state if it's the end of slice.
        if (elem.localName === 'measure' && Number(elem.getAttribute('n')) === params.end_n) {
          inside_slice = false;
        }
      }
      return {inside_slice: inside_slice, removed: removed};
    };

    var paramsStaves = params.staves;
    if (paramsStaves) {
      var staffDefSelector = '';
      var staffNSelector = '';
      for (i = 0, j = paramsStaves.length; i < j; i++) {
        staffDefSelector += ':not([n="' + paramsStaves[i] + '"])';
        staffNSelector += ':not([staff="' + paramsStaves[i] + '"])';
      }
    }

    var slice = MEI.cloneNode(true);
    if (paramsStaves) {
      var staffDefsToRemove = slice.querySelectorAll('staffDef' + staffDefSelector);

      for (i= 0, j=staffDefsToRemove.length;i<j;i++){
        staffDefsToRemove[i].parentNode.removeChild(staffDefsToRemove[i]);
      }
      //$(slice.getElementsByTagName('staffDef')).remove(':not(' + staffDefSelector + ')');
    }
    if (params.noClef || params.noKey || params.noMeter) {
      var scoreDef = slice.getElementsByTagName('scoreDef')[0];
      var staffDefs = scoreDef.getElementsByTagName('staffDef');
      setVisibles([scoreDef], params);
      setVisibles(staffDefs, params);
    }
    if (params.noConnectors) {
      var staffGrpElements = slice.getElementsByTagName('staffGrp');
      for (i = 0, j = staffGrpElements.length; i < j; i++) {
        staffGrpElements[i].removeAttribute('symbol');
      }

    }
    var section = slice.getElementsByTagName('section')[0];
    var inside_slice = false;

    /*
     * Iterate through each child of the section and remove everything outside
     * the slice. Remove
     */
    var section_children = section.childNodes;
    var sectionChild;

//    $(section_children).each(function () {

    var o, p, q, r, res;
    for (o=0,p=section_children.length;o<p;o++) {

      sectionChild = section_children[o];

      if (sectionChild.localName === 'ending') {
        var ending_children = sectionChild.childNodes;

        for (q=0,r=ending_children.length;q<r;q++){
          res = keepOrRemove(ending_children[q], inside_slice, staffNSelector, params);
          inside_slice = res.inside_slice;
          if (res.removed){
            q--;
            r--;
          }
        }
        if (sectionChild.getElementsByTagName('measure').length === 0) {
          sectionChild.parentNode.removeChild(sectionChild);
          o--;
          p--;
        }
      } else {
        res = keepOrRemove(sectionChild, inside_slice, staffNSelector, params);
        inside_slice = res.inside_slice;
        if (res.removed){
          o--;
          p--;
        }
      }

    }

    return slice;
  };


  if (!window.MeiLib) window.MeiLib = {};

  /**
   * Represents an MEI <b>app</b> or <b>choice</b> element.
   *
   * @class MeiLib.Alt
   * @constructor
   * @param {Element} elem
   * @param {String} xmlID the xml:id attribute value of the <b>app</b> or
   * <b>choice</b> element.
   * @param {String} parentID the xml:id attribute value of the direct parent
   * element of the <b>app</b> or <b>choice</b> element.
   * @param {String} tagname
   */
  MeiLib.Alt = function (elem, xmlID, parentID, tagname) {
    this.elem = elem;
    this.xmlID = xmlID;
    this.altitems = [];
    this.parentID = parentID;
    this.tagname = tagname;
  };

  MeiLib.Alt.prototype.getDefaultItem = function () {

    /* find the editors pick or the first alternative */
    var findDefault = function (altitems, editorspick_tagname, other_tagname) {
      var first_sic, alt;
      for (alt in altitems) {
        if (altitems[alt].tagname === editorspick_tagname) {
          return altitems[alt];
        } else if (!first_sic && (altitems[alt].tagname === other_tagname)) {
          first_sic = altitems[alt];
        }
      }
      return first_sic;
    };
    if (this.tagname === 'choice') {
      return findDefault(this.altitems, 'corr', 'sic');
    } else if (this.tagname === 'app') {
      //      return findDefault(this.altitems, 'lem', 'rdg');
      return findDefault(this.altitems, 'lem');
    }
  };


  if (!window.MeiLib) window.MeiLib = {};

  /**
   * @class MeiLib.Variant
   * Represents a <b>lem</b>, <b>rdg</b>, <b>sic</b> or <b>corr</b> element.
   *
   * @constructor
   * @param elem {Element}
   * @param xmlID {String} the xml:id attribute value of the element.
   * @param tagname {String} 'lem' for <b>lem</b> and 'rdg for <b>rdg</b> elements.
   * @param source {String} space-separated list of the source IDs what the given
   *            item belongs to.
   * @param resp {String} xmlID of the editor responsible for the given reading or
   *            correction.
   * @param n {String} @n attribute value of the element.
   */
  MeiLib.Variant = function (elem, xmlID, tagname, source, resp, n) {
    this.elem = elem;
    this.xmlID = xmlID;
    this.tagname = tagname;
    this.source = source;
    this.resp = resp;
    this.n = n;
  };


  if (!window.MeiLib) window.MeiLib = {};

  /**
   * @class MeiLib.MeiDoc
   * A Rich MEI is an MEI that contain ambiguity represented by Critical Apparatus
   * (<b>app</b>, <b>rdg</b>, etc.), or Editorial Transformation (<b>choice</b>,
   * <b>corr</b>, etc.)
   * elements.
   *
   * @constructor
   * @param {XMLDocument} meiXmlDoc the MEI document.
   */
  MeiLib.MeiDoc = function (meiXmlDoc) {
    if (meiXmlDoc) {
      this.init(meiXmlDoc);
    }
  };
  /**
   * @method init
   * Initializes a <code>MeiLib.MeiDoc</code> object.
   *
   * The constructor extracts information about alternative encodings and compiles
   * them into a JS object (this.ALTs). The obejcts are exposed as per the
   * following: 1. <code>sourceList</code> is the list of sources as defined in
   * the MEI header (meiHead). 2. <code>editorList</code> is the list of editors
   * listed in the MEI header. 3. <code>ALTs</code> is the object that contains
   * information about the alternative encodings. It contains one entry per for
   * each <b>app</b> or <b>choice</b> element. It is indexed by the xml:id
   * attribute value of the elements. 4. <code>altgroups</code> is the obejct that
   * contains how <b>app</b> and <b>choice</b> elements are grouped together to
   * form a logical unit of alternative encoding.
   *
   * @param {XMLDocument} meiXmlDoc an XML document containing the rich MEI
   */
  MeiLib.MeiDoc.prototype.init = function (meiXmlDoc) {
    this.xmlDoc = meiXmlDoc;
    this.rich_head = meiXmlDoc.getElementsByTagNameNS("http://www.music-encoding.org/ns/mei", 'meiHead')[0];
    this.rich_music = meiXmlDoc.getElementsByTagNameNS("http://www.music-encoding.org/ns/mei", 'music')[0];
    this.rich_score = this.rich_music.getElementsByTagName('score')[0];
    this.parseSourceList();
    this.parseEditorList();
    this.parseALTs();
    this.initAltgroups();
    this.initSectionView();
  };
  /**
   * @method getRichScore
   */
  MeiLib.MeiDoc.prototype.getRichScore = function () {
    return this.rich_score;
  };
  /**
   * @method getPlainScore
   */
  MeiLib.MeiDoc.prototype.getPlainScore = function () {
    return this.plain_score;
  };
  /**
   * @method getALTs
   */
  MeiLib.MeiDoc.prototype.getALTs = function () {
    return this.ALTs;
  };
  /**
   * @method getSourceList
   */
  MeiLib.MeiDoc.prototype.getSourceList = function () {
    return this.sourceList;
  };
  /**
   * @method getEditorList
   */
  MeiLib.MeiDoc.prototype.getEditorList = function () {
    return this.editorList;
  };
  /**
   * @method parseSourceList
   * Extracts information about the sources as defined in the MEI header.
   *
   * @return {Object} is a container indexed by the xml:id attribute value of the
   *         <b>sourceDesc</b> element.
   */
  MeiLib.MeiDoc.prototype.parseSourceList = function () {
    // var srcs = $(this.rich_head).find('sourceDesc').children();
    // this.sourceList = {};
    // var i
    // for(i=0;i<srcs.length;++i) {
    // var src = srcs[i];
    // var xml_id = $(src).attr('xml:id');
    // var serializer = new XMLSerializer();
    // this.sourceList[xml_id] = serializer.serializeToString(src);
    // }
    // return this.sourceList;

    //    this.sources = $(this.rich_head.getElementsByTagName('sourceDesc')).children();

    var elementFilter = function (node) {
      return node.nodeType === 1;
    };

    var sourceDesc = this.rich_head.getElementsByTagName('sourceDesc')[0];
    if (sourceDesc){
      this.sources = Array.prototype.filter.call(sourceDesc.childNodes, elementFilter);
    } else {
      this.sources = [];
    }

    return this.sources;
  };
  /**
   * @method parseEditorList
   */
  MeiLib.MeiDoc.prototype.parseEditorList = function () {
    // var edtrs = $(this.rich_head).find('titleStmt').children('editor');
    // this.editorList = {};
    // var i
    // for(i=0;i<edtrs.length;++i) {
    // var edtr = edtrs[i];
    // var xml_id = $(edtr).attr('xml:id');
    // this.editorList[xml_id] = edtr;
    // }

    //    this.editors = $(this.rich_head.getElementsByTagName('titleStmt')).children('editor');

    var editorFilter = function (node) {
      return node.localName === 'editor';
    };

    var titleStmt = this.rich_head.getElementsByTagName('titleStmt')[0];
    if (titleStmt) {
      this.editors = Array.prototype.filter.call(titleStmt.childNodes, editorFilter);
    } else {
      this.editors = [];
    }

    return this.editors;
  };
  /**
   * @method parseALTs
   * Extracts information about the elements encoding alternatives. The method
   * stores its result in the <code>ALTs</code> property.
   *
   * <code>ALTs</code> is a container of MeiLib.Alt obejcts indexed by the
   * xml:id attribute value of the <b>app</b> or <b>choice</b> elements.
   */
  MeiLib.MeiDoc.prototype.parseALTs = function () {
    var i, j;
    this.ALTs = {};
    // console.log(this.rich_score);
    var apps = this.rich_score.querySelectorAll('app, choice');
    for (i = 0; i < apps.length; i++) {
      var app = apps[i];
      var parent = app.parentNode;
      var altitems = app.querySelectorAll('rdg, lem, sic, corr');
      var AppsItem = new MeiLib.Alt(app, MeiLib.XMLID(app), MeiLib.XMLID(parent), app.localName);
      AppsItem.altitems = {};
      for (j = 0; j < altitems.length; j++) {
        var altitem = altitems[j];
        var source = altitem.getAttribute('source');
        var resp = altitem.getAttribute('resp');
        var n = altitem.getAttribute('n');
        var tagname = altitem.localName;
        var varXMLID = MeiLib.XMLID(altitem);
        AppsItem.altitems[varXMLID] = new MeiLib.Variant(altitem, varXMLID, tagname, source, resp, n);
      }
      this.ALTs[MeiLib.XMLID(app)] = AppsItem;
    }
  };
  /**
   * @method initAltgroups
   */
  MeiLib.MeiDoc.prototype.initAltgroups = function () {
    var i, j, altgroup, token_list;
    //var ALTs = this.ALTs;
    var annots = this.rich_score.querySelectorAll('annot[type="appGrp"], annot[type="choiceGrp"]');
    this.altgroups = {};
    for (i = 0; i < annots.length; i++) {
      altgroup = [];
      token_list = annots[i].getAttribute('plist').split(' ');
      for (j = 0; j < token_list.length; j++) {
        altgroup.push(token_list[j].replace('#', ''));
      }
      for (j in altgroup) {
        this.altgroups[altgroup[j]] = altgroup;
      }
    }
  };
  /**
   * @method initSectionView
   * The MeiLib.MeiDoc.initSectionView transforms the rich MEI (this.rich_score)
   * into a plain MEI (this.sectionview_score)
   *
   * An MEI is called 'plain' MEI if it contains no <b>app</b> or <b>choice</b>
   * elements.
   * Such an MEI can also be referred after the analogy of 2D section views of a
   * 3D object: the rich MEI is a higher-dimensional object, of which we would
   * like to display a 'flat' section view. The term 'section plane' refers to a
   * combination of alternatives at different locations in the score. The section
   * plane defines the actual view of the higher-dimensional object. For instance,
   * consider a score that has two different variants at measure #5 (let's call
   * them (variant A and variant B), and it contains three different variants at
   * measure #10 (let's call those ones variants C, D and E). In this case the
   * section plane would contain two elements the first one is either A or B, the
   * second one is C, D or E.
   *
   * The extracted information about all the <b>app</b> and <b>choice</b> elements
   * are stored in an array. Using this array the application can access information
   * such as what alternative encodings are present in the score, what source a
   * variant comes from, etc. This array is exposed by te <code>ALTs</code>
   * property.
   *
   */

  MeiLib.MeiDoc.prototype.selectDefaultAlternative = function (alt) {
    var result = {};

    // TODO check: is it OK to query all descendant corr/sic etc elements? (or would children be better?) --
    // (nested apps)

    if (alt.localName === 'choice') {
      // ...the default replacement is...
      var corr = alt.getElementsByTagName('corr')[0];
      if (corr) {
        // ...the first corr...
        result.alt_item_xml_id = MeiLib.XMLID(corr);
        result.alt_item = corr;
        //...or
      } else {
        // ...the first sic.
        var sic = alt.getElementsByTagName('sic')[0];
        if (sic) {
          result.alt_item_xml_id = MeiLib.XMLID(sic);
          result.alt_item = sic;
        } else {
          result = {};
        }
      }
    } else {
      var lem = alt.getElementsByTagName('lem')[0];
      if (lem) {
        // ...the first lem...
        result.alt_item_xml_id = MeiLib.XMLID(lem);
        result.alt_item = lem;
        //...or nothing:
      } else {
        var rdg = alt.getElementsByTagName('rdg')[0];
        if (rdg) {
          // ...the first rdg...
          result.alt_item_xml_id = MeiLib.XMLID(rdg);
          result.alt_item = rdg;
          //...or nothing:
        } else {
          result = {};
        }
      }
    }
    return result;
  };

  MeiLib.MeiDoc.prototype.initSectionView = function (altReplacements) {
    altReplacements = altReplacements || {};
    // Make a copy of the rich MEI. We don't want to remove nodes from the
    // original object.
    this.sectionview_score = this.rich_score.cloneNode(true);
    this.sectionplane = {};

    // Transform this.sectionview_score into a plain MEI:
    //
    // * itereate through all <app> and <choice> elements:
    // o chose the appropriate rdg or lem defined by sectionplane
    // (sectionplane[app.xmlID]).
    // If nothing is defined, leave it empty.
    // o chose the appropriate sic or corr defined by sectionplance
    // (sectionplane[choice.xmlID])
    // If nothing is defined, chose the first corr, if exists, otherwise chose
    // sic, if exists.
    // When replacing an item, mark the location of replacement with XML
    // processing instructions.

    var alts = this.sectionview_score.querySelectorAll('app, choice');

    var alt_item_xml_id;
    var this_sectionview_score = this.sectionview_score;
    var this_sectionplane = this.sectionplane;
    var this_ALTs = this.ALTs;
    var xmlDoc = this.xmlDoc;
    var me = this;
    var alt;
    var i, j;
    for (i = 0, j = alts.length; i < j; i++) {
      alt = alts[i];


      var alt_xml_id = MeiLib.XMLID(alt);
      var replacement = altReplacements[alt_xml_id];
      if (replacement) {
        // apply replacement, or...
        alt_item_xml_id = replacement.xmlID;

//        var alt_item2insert = this_sectionview_score.querySelector(replacement.tagname + '[*|id="' + alt_item_xml_id +
//                                                                   '"]');

        var alt_item2insert = $(this_sectionview_score).find(replacement.tagname + '[xml\\:id="' + alt_item_xml_id +
                                                             '"]')[0];

        if (!alt_item2insert) {
          throw new MeiLib.RuntimeError('MeiLib.MeiDoc.prototype.initSectionView():E01', "Cannot find <lem>, <rdg>, <sic>, or <corr> with @xml:id '" +
                                                                                         alt_item_xml_id + "'.");
        }
      } else {
        var defaultAlt = me.ALTs[alt_xml_id].getDefaultItem();
        if (defaultAlt) {
          alt_item_xml_id = defaultAlt.xmlID;
          alt_item2insert = defaultAlt.elem;
        }
      }
      var parent = alt.parentNode;
      var PIStart = xmlDoc.createProcessingInstruction('MEI2VF', 'rdgStart="' + alt_xml_id + '"');
      parent.insertBefore(PIStart, alt);
      if (alt_item2insert) {
        var childNodes = alt_item2insert.childNodes;
        var k;
        for (k = 0; k < childNodes.length; ++k) {
          parent.insertBefore(childNodes.item(k).cloneNode(true), alt);
        }
      }
      var PIEnd = xmlDoc.createProcessingInstruction('MEI2VF', 'rdgEnd="' + alt_xml_id + '"');
      parent.insertBefore(PIEnd, alt);
      parent.removeChild(alt);

      this_sectionplane[alt_xml_id] = [];
      if (this_ALTs[alt_xml_id].altitems[alt_item_xml_id]) {
        this_sectionplane[alt_xml_id].push(this_ALTs[alt_xml_id].altitems[alt_item_xml_id]);
      }
    }

    return this.sectionview_score;

  };
  /**
   * @method updateSectionView
   * Updates the sectionview score (plain MEI) by replacing one or more
   * alternative instance with other alternatives.
   *
   * @param sectionplaneUpdate
   *            {object} the list of changes. It is an container of xml:id
   *            attribute values of <b>rdg</b>, <b>lem</b>, <b>sic</b> or
   * <b>corr</b> elements,
   *            indexed by the xml:id attribute values of the corresponding
   * <b>app</b>
   *            or <b>choice</b> elements. sectionplaneUpdate[altXmlID] =
   * altInstXmlID
   *            is the xml:id attribute value of the <b>rdg</b>, <b>lem</b>,
   * <b>sic</b> or <b>corr</b>
   *            element, which is to be inserted in place of the original <app
   *            xml:id=altXmlID> or <b>choice xml:id=altXmlID</b> When replacing an
   *            <b>app</b> or <b>choice</b> that is part of a group of such
   * elements
   *            (defined by this.altgroups), then those other elements needs to be
   *            replaced as well.
   */
  MeiLib.MeiDoc.prototype.updateSectionView = function (sectionplaneUpdate) {

    var altID, altID__;

    var corresponding_alt_item = function (altitems, altitem) {
      var vars_match = function (v1, v2) {
        var res = 0;
        for (var field in v1) {
          if (v1[field] !== undefined && v1[field] === v2[field]) {
            res++;
          }
        }
        //      console.log('vars_match: ' + res);
        return res;
      };
      var max = 0;
      var corresponding_item, M;
      for (var alt_item_id in altitems) {
        M = vars_match(altitems[alt_item_id], altitem);
        if (max < M) {
          max = M;
          corresponding_item = altitems[alt_item_id];
        }
      }
      return corresponding_item;
    };

    for (altID in sectionplaneUpdate) {
      var this_ALTs = this.ALTs;
      var altitems2insert = [];
      // preserving backward compatibility:
      if (typeof sectionplaneUpdate[altID] === 'string') {
        sectionplaneUpdate[altID] = [sectionplaneUpdate[altID]];
      }
      var i, j;
      j = sectionplaneUpdate[altID].length;
      if (j > 0) {
        for (i = 0; i < j; i++) {
          altitems2insert.push(this_ALTs[altID].altitems[sectionplaneUpdate[altID][i]]);
        }
        //        $(sectionplaneUpdate[altID]).each(function () {
        //          altitems2insert.push(this_ALTs[altID].altitems[this]);
        //        });

      } else {
        var defaultAltItem = this.ALTs[altID].getDefaultItem();
        if (defaultAltItem) {
          altitems2insert.push(defaultAltItem);
        }
      }
      var altgroup = this.altgroups[altID];
      if (altgroup) {
        // if altID is present in altgroups, then replace all corresponding alts
        // with the
        // altitems that correspons to the any of the alt item that are being
        // inserted.
        for (i = 0; i < altgroup.length; i++) {
          altID__ = altgroup[i];
          var altitems2insert__ = [];

          var k, l;
          for (k = 0, l = altitems2insert.length; k < l; k++) {
            altitems2insert__.push(corresponding_alt_item(this_ALTs[altID__].altitems, altitems2insert[k]));
          }
          //          $(altitems2insert).each(function () {
          //            altitems2insert__.push(corresponding_alt_item(this_ALTs[altID__].altitems, this))
          //          });

          this.replaceAltInstance({
            appXmlID : altID__,
            replaceWith : altitems2insert__
          });
        }
      } else {
        // otherwise just replace alt[xml:id=altID] with the list of items
        this.replaceAltInstance({
          appXmlID : altID,
          replaceWith : altitems2insert
        });
      }
    }
  };
  /**
   * @method replaceAltInstance
   * Replace an alternative instance in the sectionview score and in the
   * sectionplane
   *
   * @param {Object} alt_inst_update
   * @return {Object} the updated score
   */
  MeiLib.MeiDoc.prototype.replaceAltInstance = function (alt_inst_update) {

    var extendWithNodeList = function (nodeArray, nodeList) {
      var res = nodeArray;
      var i;
      for (i = 0; i < nodeList.length; ++i) {
        res.push(nodeList.item(i));
      }
      return res;
    };
    var app_xml_id = alt_inst_update.appXmlID;


    var parent = $(this.sectionview_score).find('[xml\\:id=' + this.ALTs[app_xml_id].parentID + ']')[0];
    if (typeof parent === 'undefined') {
      return;
    }

//    var parent = this.sectionview_score.querySelector('[*|id=' + this.ALTs[app_xml_id].parentID + ']');
//    if (parent === null) {
//      return;
//    }

    var children = parent.childNodes;

    var replaceWith = alt_inst_update.replaceWith;
    var nodes2insert = [];
    var this_rich_score = this.rich_score;
    if (replaceWith) {
      var i, j;
      for (i = 0; i < replaceWith.length; ++i) {
        var replaceWith_item = replaceWith[i];
        var replaceWith_xmlID = replaceWith_item.xmlID;

        var var_inst_elem = $(this_rich_score).find(replaceWith_item.tagname + '[xml\\:id="' + replaceWith_xmlID +
                                                    '"]')[0];
//        var var_inst_elem = this_rich_score.querySelector(replaceWith_item.tagname + '[*|id="' + replaceWith_xmlID +
//                                                          '"]');
        nodes2insert = extendWithNodeList(nodes2insert, var_inst_elem.childNodes);
      }
    }
    //  console.log(nodes2insert)

    var match_pseudo_attrValues = function (data1, data2) {
      data1 = data1.replace("'", '"');
      data2 = data2.replace("'", '"');
      return data1 === data2;
    };

    var inside_inst = false;
    var found = false;
    var insert_before_this = null;

    for (i = 0, j = children.length; i < j; i++) {
      var child = children[i];
      if (child.nodeType === 7) {
        if (child.nodeName === 'MEI2VF' && match_pseudo_attrValues(child.nodeValue, 'rdgStart="' + app_xml_id + '"')) {
          inside_inst = true;
          found = true;
        } else if (child.nodeName === 'MEI2VF' &&
                   match_pseudo_attrValues(child.nodeValue, 'rdgEnd="' + app_xml_id + '"')) {
          inside_inst = false;
          insert_before_this = child;
        }
      } else if (inside_inst) {
        parent.removeChild(child);
        i--;
        j--;
      }
    }

    if (!found) {
      throw "processing instruction not found";
    }
    if (inside_inst) {
      throw "Unmatched <?MEI2VF rdgStart?>";
    }

    var insert_method;
    if (insert_before_this) {
      insert_method = function (elem) {
        parent.insertBefore(elem, insert_before_this)
      };
    } else {
      insert_method = function (elem) {
        parent.appendChild(elem)
      };
    }

    for (i = 0, j = nodes2insert.length; i < j; i++) {
      insert_method(nodes2insert[i].cloneNode(true));
    }

    this.sectionplane[app_xml_id] = alt_inst_update.replaceWith;

    return this.sectionview_score;
  };

  /**
   * @method getSectionViewSlice
   * Get a slice of the sectionview_score.
   *
   * @param params
   *            {Object} contains the parameters for slicing. For more info see at
   *            documentation of MeiLib.SliceMEI
   * @return {Object} an XML DOM object containing the slice of the plain MEI
   */
  MeiLib.MeiDoc.prototype.getSectionViewSlice = function (params) {
    return MeiLib.SliceMEI(this.sectionview_score, params);
  };
  /**
   * @method getRichSlice
   * Get a slice of the whole rich MEI document.
   *
   * @param params
   *            {Obejct} contains the parameters for slicing. For more info see at
   *            documentation of MeiLib.SliceMEI
   * @return {MeiLib.MeiDoc} a MeiDoc object
   */
  MeiLib.MeiDoc.prototype.getRichSlice = function (params) {
    var slice = new MeiLib.MeiDoc();
    slice.xmlDoc = this.xmlDoc;
    slice.rich_head = this.rich_head.cloneNode(true);
    slice.rich_music = this.rich_music.cloneNode(true);
    slice.rich_score = MeiLib.SliceMEI(this.rich_score, params);
    slice.sourceList = this.sourceList;
    slice.editorList = this.editorList;
    slice.ALTs = this.ALTs;
    slice.altgroups = this.altgroups;
    return slice;
  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  /**
   * @class MEI2VF.Util
   * @singleton
   * @private
   */
  var Util = {

    /**
     * returns the attributes of an element or an empty object if the element doesn't have attributes
     */
    attsToObj : function (element) {
      var i, obj = {};
      if (element.hasAttributes()) {
        i = element.attributes.length;
        while (i--) {
          obj[element.attributes[i].nodeName] = element.attributes[i].nodeValue;
        }
      }
      return obj;
    },

    pListToArray : function (pList) {
      return (pList !== null) ? pList.split(' ') : [];
    },

    /**
     *
     */
    serializeElement : function (element) {
      var result = '<' + element.localName, i, j, atts, att;
      if (element.hasAttributes()) {
        atts = element.attributes;
        for (i = 0, j = atts.length; i < j; i += 1) {
          att = atts.item(i);
          result += ' ' + att.nodeName + '="' + att.nodeValue + '"';
        }
      }
      return result + '>';
    },


    /**
     * jQuery's method, without window check
     * @param obj
     * @returns {boolean}
     */
    isPlainObject : function (obj) {
      // Not plain objects:
      // - Any object or value whose internal [[Class]] property is not "[object Object]"
      // - DOM nodes
      if (typeof obj !== "object" || obj.nodeType) {
        return false;
      }
      if (obj.constructor && !obj.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
      }
      // If the function hasn't returned already, we're confident that
      // |obj| is a plain object, created by {} or constructed with new Object
      return true;
    },

    /**
     * jQuery's extend method, without deep parameter (deep is assumed to be true)
     */
    extend : function () {
      var options, name, src, copy, copyIsArray, clone, target = arguments[ 0 ] || {}, i = 1, length = arguments.length;

      if (typeof target !== "object" && typeof target !== 'function') {
        target = {};
      }

      for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[ i ]) != null) {
          // Extend the base object
          for (name in options) {
            src = target[ name ];
            copy = options[ name ];
            // Prevent never-ending loop
            if (target === copy) {
              continue;
            }
            // Recurse if we're merging plain objects or arrays
            if (copy && ( Util.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) )) {
              if (copyIsArray) {
                copyIsArray = false;
                clone = src && Array.isArray(src) ? src : [];
              } else {
                clone = src && Util.isPlainObject(src) ? src : {};
              }
              // Never move original objects, clone them
              target[ name ] = Util.extend(clone, copy);
              // Don't bring in undefined values
            } else if (copy !== undefined) {
              target[ name ] = copy;
            }
          }
        }
      }
      // Return the modified object
      return target;
    },

    // from sizzle.js
    getText : function (elem) {
      var node, ret = "", i = 0, nodeType = elem.nodeType;
      if (!nodeType) {
        // If no nodeType, this is expected to be an array
        while ((node = elem[i++])) {
          // Do not traverse comment nodes
          ret += this.getText(node);
        }
      } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
        // Use textContent for elements
        // innerText usage removed for consistency of new lines (jQuery #11153)
        if (typeof elem.textContent === "string") {
          return elem.textContent;
        } else {
          // Traverse its children
          for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
            ret += this.getText(elem);
          }
        }
      } else if (nodeType === 3 || nodeType === 4) {
        return elem.nodeValue;
      }
      // Do not include comment or processing instruction nodes
      return ret;
    },

    getNormalizedText : function (elem) {
      return Util.getText(elem).replace(/\s+/g, ' ')
    }

  };

  /*
   * meilib.js
   *
   * Author: Zoltan Komives Created: 05.07.2013
   *
   * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
   * University of Maryland
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not
   * use this file except in compliance with the License. You may obtain a copy of
   * the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
   * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
   * License for the specific language governing permissions and limitations under
   * the License.
   */
  /**
   * Contributor: Alexander Erhard
   */
  /**
   * @class MeiLib
   * MeiLib - General purpose JavaScript functions for processing MEI documents.
   * @singleton
   */

  if (!window.MeiLib) window.MeiLib = {};

  /**
   * @method createPseudoUUID
   */
  MeiLib.createPseudoUUID = function () {
    return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).substr(-4)
  };

  /**
   * @method durationOf
   * Calculate the duration of an event (number of beats) according to the given
   * meter.
   *
   * Event refers to musical event such as notes, rests, chords. The MEI element
   * <b>space</b> is also considered an event.
   *
   * @param evnt an XML DOM object
   * @param meter the time signature object { count, unit }
   * @param {Boolean} zeroGraceNotes Specifies if all grace notes should return the duration 0
   */
  MeiLib.durationOf = function (evnt, meter, zeroGraceNotes) {

    var IsZeroDurEvent = zeroGraceNotes ? function (evnt, tagName) {
      return evnt.hasAttribute('grace') || tagName === 'clef';
    } : function (evnt, tagName) {
      return tagName === 'clef';
    };

    var isSimpleEvent = function (tagName) {
      return (tagName === 'note' || tagName === 'rest' || tagName === 'space');
    };

    var durationOf_SimpleEvent = function (simple_evnt, meter) {
      var dur = simple_evnt.getAttribute('dur');
      if (!dur) {
        console.warn('@dur of <b>note</b>, <b>rest</b> or <b>space</b> must be specified. Proceeding with default @dur="4". Element:');
        console.log(simple_evnt);
        dur = "4";
        //      throw new MeiLib.RuntimeError('MeiLib.durationOf:E04', '@dur of <b>note</b>, <b>rest</b> or <b>space</b> must be specified.');
      }
      //    console.log(MeiLib.dotsMult(simple_evnt) * MeiLib.dur2beats(Number(dur), meter));
      return MeiLib.dotsMult(simple_evnt) * MeiLib.dur2beats(Number(dur), meter);
    };

    var durationOf_Chord = function (chord, meter, layer_no) {
      var i, j, childNodes, note;
      if (!layer_no) {
        layer_no = "1";
      }
      var dur = chord.getAttribute('dur');
      var dotsMult = MeiLib.dotsMult(chord);
      if (dur) {
        return dotsMult * MeiLib.dur2beats(Number(dur), meter);
      }
      childNodes = chord.childNodes;
      for (i = 0, j = childNodes.length; i < j; i++) {
        if (childNodes[i].localName === 'note') {
          note = childNodes[i];
          var lyr_n = note.getAttribute('layer');
          if (!lyr_n || lyr_n === layer_no) {
            var dur_note = note.getAttribute('dur');
            var dotsMult_note = MeiLib.dotsMult(chord);
            if (!dur && dur_note) {
              dur = dur_note;
              dotsMult = dotsMult_note;
            } else if (dur && dur != dur_note) {
              throw new MeiLib.RuntimeError('MeiLib.durationOf:E05', 'duration of <chord> is ambiguous. Element: ' +
                                                                     Util.serializeElement(chord));
            }
          }
        }
      }

      if (!dur) {
        throw new MeiLib.RuntimeError('MeiLib.durationOf:E06', '@dur of chord must be specified either in <chord> or in at least one of its <note> elements. Proceeding with default @dur="4". Element:' +
                                                               Util.serializeElement(chord));
      }
      return dotsMult * MeiLib.dur2beats(Number(dur), meter);
    };

    var durationOf_Beam = function (beam, meter) {
      var acc = 0, i, j, childNodes, childNode;
      childNodes = beam.childNodes;
      for (i = 0, j = childNodes.length; i < j; i++) {
        childNode = childNodes[i];
        var dur_b;
        var tagName = childNode.localName;
        if (IsZeroDurEvent(childNode, tagName)) {
          dur_b = 0;
        } else if (isSimpleEvent(tagName)) {
          dur_b = durationOf_SimpleEvent(childNode, meter);
        } else if (tagName === 'chord') {
          dur_b = durationOf_Chord(childNode, meter);
        } else if (tagName === 'beam') {
          dur_b = durationOf_Beam(childNode, meter);
        } else if (tagName === 'tuplet') {
          dur_b = durationOf_Tuplet(childNode, meter);
        } else {
          dur_b = 0;
          //throw new MeiLib.RuntimeError('MeiLib.durationOf:E03', "Not supported element '" + tagName + "'");
        }
        acc += dur_b;
      }
      return acc;
    };

    var durationOf_Tuplet = function (tuplet, meter) {
      // change the meter unit according to the ratio in the tuplet, the get the duration as if the tuplet were a beam
      var num = +tuplet.getAttribute('num') || 3;
      var numbase = +tuplet.getAttribute('numbase') || 2;
      return durationOf_Beam(tuplet, {
        count : meter.count,
        unit : meter.unit * numbase / num
      });
    };

    var evnt_name = evnt.localName;
    if (IsZeroDurEvent(evnt, evnt_name)) {
      return 0;
    }
    if (isSimpleEvent(evnt_name)) {
      return durationOf_SimpleEvent(evnt, meter);
    }
    if (evnt_name === 'mRest') {
      return meter.count;
    }
    if (evnt_name === 'chord') {
      return durationOf_Chord(evnt, meter);
    }
    if (evnt_name === 'beam') {
      return durationOf_Beam(evnt, meter);
    }
    if (evnt_name === 'tuplet') {
      return durationOf_Tuplet(evnt, meter);
    }
    return 0;
    //throw new MeiLib.RuntimeError('MeiLib.durationOf:E05', "Not supported element: '" + evnt_name + "'");

  };
  /**
   * @method tstamp2id
   * Find the event with the minimum distance from of the given timestamp.
   *
   * @param {String} tstamp the timestamp to match against events in the given
   * context. Local timestamp only (without measure part).
   * @param {Object} layer an XML DOM object, contains all events in the given
   * measure.
   * @param {Object} meter the effective time signature object { count, unit } in
   * the measure containing layer.
   * @return {String} the xml:id of the closest element, or
   * undefined if <b>layer</b> contains no events.
   */
  MeiLib.tstamp2id = function (tstamp, layer, meter) {
    var ts = Number(tstamp);
    var ts_acc = 0;
    // total duration of events before current event
    var c_ts = function () {
      return ts_acc + 1;
    };// tstamp of current event
    var distF = function () {
      return ts - c_ts();
    };// signed distance between tstamp and tstamp of current event;
    var eventList = new MeiLib.EventEnumerator(layer);
    var evnt;
    var dist;
    var prev_evnt = null;
    // previous event
    var prev_dist;
    // previous distance
    while (!eventList.EoI && (dist === undefined || dist > 0)) {
      prev_evnt = evnt;
      prev_dist = dist;
      evnt = eventList.nextEvent();
      dist = distF();
      if (!evnt.hasAttribute('grace') && evnt.localName !== 'clef') {
        ts_acc +=
        MeiLib.durationOf(evnt, meter, true) * eventList.outputProportion.numbase / eventList.outputProportion.num;
      }
      //    m = meter;
      //    e = evnt;
    }

    if (dist === undefined) {
      return undefined;
    }
    var winner;
    if (dist < 0) {
      if (prev_evnt && prev_dist < Math.abs(dist)) {
        winner = prev_evnt;
      } else {
        winner = evnt;
      }
    } else {
      winner = evnt;
    }

    var getFullNote = function (evnt) {
      if (evnt.hasAttribute('grace') || evnt.localName === 'clef') {
        return getFullNote(eventList.nextEvent()) || evnt;
      }
      return evnt;
    };

    winner = getFullNote(winner);

    var xml_id;
    xml_id = winner.getAttribute('xml:id');
    if (!xml_id) {
      xml_id = MeiLib.createPseudoUUID();
      winner.setAttribute('xml:id', xml_id);
    }
    return xml_id;
  };
  /**
   * @method XMLID
   * returns the xml:id attribute of an element; if there is none, the function
   * created a pseudo id, adds it to the element and returns that id.
   * @param {Element} elem the element to process
   * @return {String} the xml:id of the element
   */
  MeiLib.XMLID = function (elem) {
    var xml_id = elem.getAttribute('xml:id');
    if (!xml_id) {
      xml_id = MeiLib.createPseudoUUID();
      elem.setAttribute('xml:id', xml_id);
    }
    return xml_id;
  };
  /**
   * @method id2tstamp
   * Calculates a timestamp value for an event in a given context. (Event refers
   * to musical events such as notes, rests and chords).
   *
   * @param eventid {String} the xml:id of the event
   * @param context {Array} of contextual objects {layer, meter}. Time signature
   * is mandatory for the first one, but optional for the rest. All layers belong
   * to a single logical layer. They are the layer elements from some consequtive
   * measures.
   * @return {String} the MEI timestamp value (expressed in beats relative to the
   * meter of the measure containing the event) of all events that happened before
   * the given event in the given context. If the event is not in the first
   * measure (layer) the timestamp value contains a 'measure part', that is for
   * example 2m+2 if the event is at the second beat in the 3rd measure.
   */
  MeiLib.id2tstamp = function (eventid, context) {
    var meter;
    var found = false;
    for (var i = 0; i < context.length && !found; ++i) {
      if (context[i].meter) {
        meter = context[i].meter;
      }
      if (i === 0 && !meter) {
        throw new MeiLib.RuntimeError('MeiLib.id2tstamp:E001', 'No time signature specified');
      }

      var result = MeiLib.sumUpUntil(eventid, context[i].layer, meter);
      if (result.found) {
        found = true;
        return i.toString() + 'm' + '+' + (result.beats + 1).toString();
      }
    }
    throw new MeiLib.RuntimeError('MeiLib.id2tstamp:E002', 'No event with xml:id="' + eventid +
                                                           '" was found in the given MEI context.');
  };

  /**
   * @method dur2beats
   * Convert absolute duration into relative duration (nuber of beats) according
   * to time signature.
   *
   * @param dur {Number} reciprocal value of absolute duration (e.g. 4->quarter
   * note, 8->eighth note, etc.)
   * @param {Object} meter the time signature object { count, unit }
   * @return {Number}
   */
  MeiLib.dur2beats = function (dur, meter) {
    return (meter.unit / dur);
  };
  /**
   * @method beats2dur
   * Convert relative duration (nuber of beats) into absolute duration (e.g.
   * quarter note, eighth note, etc) according to time signature.
   *
   * @param beats {Number} duration in beats @param meter time signature object {
 * count, unit } @return {Number} reciprocal value of absolute duration (e.g. 4
   * -> quarter note, 8 -> eighth note, etc.)
   * @param {Object} meter
   */
  MeiLib.beats2dur = function (beats, meter) {
    return (meter.unit / beats);
  };
  /**
   * @method dotsMult
   * Converts the <b>dots</b> attribute value into a duration multiplier.
   *
   * @param node XML DOM object containing a node which may have <code>dots</code>
   * attribute
   * @return {Number} The result is 1 if no <code>dots</code> attribute is present.
   * For <code>dots="1"</code> the result is 1.5, for <code>dots="2"</code> the
   * result is 1.75, etc.
   */
  MeiLib.dotsMult = function (node) {
    var dots = node.getAttribute('dots');
    dots = Number(dots || "0");
    var mult = 1;
    for (; dots > 0; --dots) {
      mult += (1 / Math.pow(2, dots))
    }
    return mult;
  };
  /**
   * @method sumUpUntil
   * For a given event (such as note, rest chord or space) calculates the combined
   * length of preceding events, or the combined length of all events if the given
   * event isn't present.
   *
   * @param {String} eventid the value of the xml:id attribute of the event
   * @param {Object} layer an XML DOM object containing the MEI <b>Layer</b>
   * element
   * @param {Object} meter the time signature object { count, unit }
   * @return {Object} an object { beats:number, found:boolean }. 1. 'found' is true
   * and 'beats' is the total duration of the events that happened before the event
   * 'eventid' within 'layer', or 2. 'found' is false and 'beats is the total
   * duration of the events in 'layer'.
   */
  MeiLib.sumUpUntil = function (eventid, layer, meter) {

    var sumUpUntil_inNode = function (node) {
      var beats, children, found = null, dur, dots, subtotal, chord_dur, i;
      var node_name = node.localName;
      if (node.hasAttribute('grace') || node_name === 'clef') {
        return {
          beats : 0,
          found : (node.getAttribute('xml:id') === eventid)
        };
      }
      if (node_name === 'note' || node_name === 'rest') {
        if (node.getAttribute('xml:id') === eventid) {
          return {
            beats : 0,
            found : true
          };
        } else {
          dur = Number(node.getAttribute('dur'));
          if (!dur) {
            throw new MeiLib.RuntimeError('MeiLib.sumUpUntil:E001', "Duration is not a number ('breve' and 'long' are not supported).");
          }
          dots = node.getAttribute('dots');
          dots = Number(dots || "0");
          beats = MeiLib.dotsMult(node) * MeiLib.dur2beats(dur, meter);

          return {
            beats : beats,
            found : false
          };
        }
      } else if (node_name === 'mRest') {
        if (node.getAttribute('xml:id') === eventid) {
          return {
            beats : 0,
            found : true
          };
        } else {
          return {
            beats : meter.count,
            found : false
          };
          // the duration of a whole bar expressed in number of beats.
        }
      } else if (node_name === 'layer' || node_name === 'beam' || node_name === 'tuplet') {

        // sum up childrens' duration
        beats = 0;
        children = node.childNodes;
        found = false;
        for (i = 0; i < children.length && !found; ++i) {
          if (children[i].nodeType === 1) {
            subtotal = sumUpUntil_inNode(children[i]);
            beats += subtotal.beats;
            found = subtotal.found;
          }
        }
        return {
          beats : beats,
          found : found
        };
      } else if (node_name === 'chord') {
        chord_dur = node.getAttribute('dur');
        if (node.getAttribute('xml:id') === eventid) {
          return {
            beats : 0,
            found : true
          };
        } else {
          // ... or find the longest note in the chord ????
          chord_dur = node.getAttribute('dur');
          if (chord_dur) {
            //            if (node.querySelector("[*|id='" + eventid + "']")) {
            if ($(node).find("[xml\\:id='" + eventid + "']").length) {
              return {
                beats : 0,
                found : true
              };
            } else {
              return {
                beats : MeiLib.dur2beats(chord_dur, meter),
                found : found
              };
            }
          } else {
            children = node.childNodes;
            found = false;
            for (i = 0; i < children.length && !found; ++i) {
              if (children[i].nodeType === 1) {
                subtotal = sumUpUntil_inNode(children[i]);
                beats = subtotal.beats;
                found = subtotal.found;
              }
            }
            return {
              beats : beats,
              found : found
            };
          }
        }
      }
      return {
        beats : 0,
        found : false
      };
    };

    return sumUpUntil_inNode(layer);
  };


  var RuntimeError = function (message) {
    this.name = 'MEI2VF Runtime Error';
    this.message = message;
    this.stack = (new Error()).stack;
  };
  RuntimeError.prototype = new Error;
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  var DefaultAppender = {
    error : function () {
      window.console.error('MEI2VF (' + arguments[0] + "): " + Array.prototype.slice.call(arguments, 1).join(' '));
    },
    info : function () {
      window.console.info('MEI2VF (' + arguments[0] + "): " + Array.prototype.slice.call(arguments, 1).join(' '));
    },
    warn : function () {
      window.console.warn('MEI2VF (' + arguments[0] + "): " + Array.prototype.slice.call(arguments, 1).join(' '));
    },
    debug : function () {
      window.console.log('MEI2VF (' + arguments[0] + "): " + Array.prototype.slice.call(arguments, 1).join(' '));
    }
  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  var emptyFn = function () {
  };

  var Logger = {

    error : emptyFn,
    info : emptyFn,
    warn : emptyFn,
    debug : emptyFn,

    /**
     * An appender object to which the log messages are sent; has to provide the methods error, info, warn and debug;
     * defaults to window.console
     */
    appender : DefaultAppender,

    /**
     * Sets the object to which log messages are sent
     * @param appender
     * @returns {Logger}
     */
    setAppender : function (appender) {
      if (typeof appender === 'object') {
        if (typeof appender.error === 'function' && typeof appender.warn === 'function' &&
            typeof appender.info === 'function' && typeof appender.debug === 'function') {
          this.appender = appender;
          return this;
        }
        throw new RuntimeError('Parameter object does not contain the expected appender methods.');
      }
      throw new RuntimeError('Parameter is not an object');
    },

    /**
     * @method setLevel sets the logging level. Values:
     *
     * - 'debug'|true debug messages
     * - 'info' info, e.g. unsupported elements
     * - 'warn' warnings, e.g. wrong encodings
     * - 'error' errors
     * - false no logging
     * @param {String} level
     */
    setLevel : function (level) {
      var i, j, allLevels, activate = false;
      allLevels = [
        'debug',
        'info',
        'warn',
        'error'
      ];
      if (level === true) activate = true;
      for (i = 0, j = allLevels.length; i < j; i += 1) {
        if (allLevels[i] === level) activate = true;
        if (activate) {
          this[allLevels[i]] = this.appender[allLevels[i]].bind(this.appender);
        } else {
          this[allLevels[i]] = emptyFn;
        }
      }
    }

  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var EventContext = function (notes_by_id, system_n) {

    var me = this;

    me.notes_by_id = notes_by_id;
    me.system_n = system_n;
    me.newBeamInfosToResolve = [];
    me.clefCheckQueue = [];

  };

  EventContext.prototype = {

    startNewStave : function(stave, stave_n) {
      var me = this;

      me.stave = stave;
      me.stave_n = stave_n;

      /**
       * inBeamNo specifies the number of beams the current events are under
       */
      me.inBeamNo = 0;
      /**
       * hasStemDirInBeam specifies if a stem.dir has been specified in the current beam
       */
      me.hasStemDirInBeam = false;
      me.hasSpaceInBeam = false;
      /**
       * Grace note or grace chord objects to be added to the next non-grace note or chord
       * @property {Vex.Flow.StaveNote[]} graceNoteQueue
       */
      me.graceNoteQueue = [];
      me.clefChangeInfo = null;

      me.beamInfosToResolve = me.newBeamInfosToResolve;
      me.newBeamInfosToResolve = [];
    },

    setLayerDir : function (layerDir) {
      this.layerDir = layerDir;
    },

    getLayerDir : function () {
      return this.layerDir;
    },

    setStaveN : function(n) {
      this.stave_n = n;
    },

    setStave : function(stave) {
      this.stave = stave;
    },

    getStave : function () {
      return this.stave;
    },

    enterBeam : function () {
      this.inBeamNo += 1;
    },

    exitBeam : function () {
      var me = this;
      me.inBeamNo -= 1;
      if (me.inBeamNo === 0) {
        me.hasStemDirInBeam = false;
        me.hasSpaceInBeam = false;
      }
    },

    addBeamInfoToResolve : function (element, vexNotes) {
      this.newBeamInfosToResolve.push({
        element : element,
        vexNotes : vexNotes
      });
    },

    shiftBeamInfoToResolve : function () {
      return this.beamInfosToResolve.shift();
    },

    setSpaceInBeam : function (val) {
      this.hasSpaceInBeam = val;
    },

    getSpaceInBeam : function () {
      return this.hasSpaceInBeam;
    },

    setStemDirInBeam : function (val) {
      this.hasStemDirInBeam = val;
    },

    getStemDirInBeam : function () {
      return this.hasStemDirInBeam;
    },

    isInBeam : function (){
      return this.inBeamNo > 0;
    },

    addEvent : function (xml_id, obj) {
      var me = this;
      obj.system = me.system_n;
      obj.layerDir = me.layerDir;
      me.notes_by_id[xml_id] = obj;
    },

    setClefChangeInfo : function (info) {
      this.clefChangeInfo = info;
    },

    getClefChangeInfo : function () {
      return this.clefChangeInfo;
    },

    addToClefCheckQueue : function (event) {
      this.clefCheckQueue.push(event);
    },

    emptyClefCheckQueue : function () {
      this.clefCheckQueue = [];
    }

  };
/*
 * Component of MEItoVexFlow Author: Raffaele Viglianti, 2012
 *
 * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
/**
 * Contributor: Alexander Erhard
 */

/**
 * @class MEI2VF
 * @singleton
 * Tables for MEI <-> VexFlow values
 */



  /**
   * @private
   * @namespace {Object} Tables
   */
  var Tables = {

    accidentals : {
      'n' : 'n',
      'f' : 'b',
      's' : '#',
      'ff' : 'bb',
      'ss' : '##',
      'x' : '##'
    },

    durations : {
      'long' : '1/4',
      'breve' : '1/2',
      '1' : 'w',
      '2' : 'h',
      '4' : 'q',
      '8' : '8',
      '16' : '16',
      '32' : '32',
      '64' : '64'
      // '128': '',
      // '256': '',
      // '512': '',
      // '1024': '',
      // '2048': '',
      // 'maxima': '',
      // 'longa': '',
      // 'brevis': '',
      // 'semibrevis': '',
      // 'minima': '',
      // 'semiminima': '',
      // 'fusa': '',
      // 'semifusa': ''
    },

    positions : {
      'above' : VF.Modifier.Position.ABOVE,
      'below' : VF.Modifier.Position.BELOW
    },

    hairpins : {
      'cres' : VF.StaveHairpin.type.CRESC,
      'dim' : VF.StaveHairpin.type.DECRESC
    },

    articulations : {
      'acc' : 'a>',
      'stacc' : 'a.',
      'ten' : 'a-',
      'stacciss' : 'av',
      'marc' : 'a^',
      // 'marc-stacc':
      // 'spicc':
      // 'doit':
      // 'rip':
      // 'plop':
      // 'fall':
      // 'bend':
      // 'flip':
      // 'smear':
      'dnbow' : 'am',
      'upbow' : 'a|',
      // 'harm':
      'snap' : 'ao',
      // 'fingernail':
      // 'ten-stacc':
      // 'damp':
      // 'dampall':
      // 'open':
      // 'stop':
      // 'dbltongue':
      // 'trpltongue':
      // 'heel':
      // 'toe':
      // 'tap':
      'lhpizz' : 'a+',
      'dot' : 'a.',
      'stroke' : 'a|'
    },

    articulationsBelow : {
      'acc' : 'a>',
      'stacc' : 'a.',
      'ten' : 'a-',
      'stacciss' : 'avb', // different glyph
      'marc' : 'a^b', // different glyph
      'dnbow' : 'am',
      'upbow' : 'a|',
      'snap' : 'ao',
      'lhpizz' : 'a+',
      'dot' : 'a.',
      'stroke' : 'a|'
    },

    fermata : {
      'above' : 'a@a',
      'below' : 'a@u'
    }

  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  var Articulation = function (type) {
    this.init(type);
  };

  Articulation.CATEGORY = "articulations";

  Vex.Inherit(Articulation, VF.Articulation, {

    init : function (type) {
      Articulation.superclass.init.call(this, type);
      this.meiElement = [];
    },

    addMeiElement : function (element) {
      this.meiElement.push(element);
      return this;
    },

    getMeiElement : function () {
      return this.meiElement;
    },

    draw : function () {

      if (this.position === null) {
        this.position = (this.note.getStemDirection() === VF.StaveNote.STEM_DOWN) ? VF.Modifier.Position.ABOVE : VF.Modifier.Position.BELOW;
      }

      Articulation.superclass.draw.call(this);
    }

  });
/*
 * MEItoVexFlow, EventUtil class
 * (based on meitovexflow.js)
 * Author of reworkings: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



  var EventUtil = {

    DIR : {
      down : VF.StaveNote.STEM_DOWN,
      up : VF.StaveNote.STEM_UP
    },

    /**
     * converts the pitch of an MEI element to a VexFlow pitch
     *
     * @method getVexPitch
     * @param {Element} element the MEI element from which the pitch should be read
     * @return {String} the VexFlow pitch
     */
    getVexPitch : function (element) {
      var pname, oct;
      pname = element.getAttribute('pname');
      oct = element.getAttribute('oct');
      if (!pname || !oct) {
        Logger.warn('Missing attributes', '@pname and @oct must be specified in ' + Util.serializeElement(element) +
                                          '". Setting default pitch c4.');
        return 'c/4';
      }
      return pname + '/' + oct;
    },

    /**
     * @method translateDuration
     */
    translateDuration : function (element, mei_dur) {
      var result = Tables.durations[mei_dur + ''], alias;
      if (!result) {
        alias = {
          'brevis' : 'breve',
          'longa' : 'long'
        };
        if (alias[mei_dur]) {
          Logger.info('Not supported', 'Duration "' + mei_dur + '" in ' + Util.serializeElement(element) +
                                       ' is not supported. Using "' + alias[mei_dur] + '" instead.');
          return Tables.durations[alias[mei_dur] + ''];
        }
        if (mei_dur === undefined) {
          throw new RuntimeError('No duration attribute found in ' + Util.serializeElement(element));
        } else {
          Logger.warn('Not supported', 'Duration "' + mei_dur + ' in "' + Util.serializeElement(element) +
                                       '" is not supported. Using "4" instead.');
        }
        result = Tables.durations['4'];
      }
      return result;
    },

    /**
     * @method processAttsDuration
     */
    processAttsDuration : function (element, atts) {
      var me = this, dur;
      dur = me.translateDuration(element, atts.dur);
      return (atts.dots === '1') ? dur + 'd' : (atts.dots === '2') ? dur + 'dd' : dur;
    },

    /**
     * @method processAttrAccid
     */
    processAttrAccid : function (mei_accid, vexObject, i) {
      var val = Tables.accidentals[mei_accid];
      if (val) {
        vexObject.addAccidental(i, new VF.Accidental(val));
      } else {
        Logger.warn('Not supported', 'The value "' + mei_accid + '" is not supported in @accid. Ignoring attribute.');
      }
    },

    /**
     * @method processAttrHo
     */
    processAttrHo : function (mei_ho, vexObject, stave) {
      vexObject.setExtraLeftPx(+mei_ho * stave.getSpacingBetweenLines() / 2);
    },

    /**
     * adds an articulation to a note-like object
     * @method addArticulation
     * @param {Vex.Flow.StaveNote} note the note-like VexFlow object
     * @param {Element} element the articulation element
     */
    addArticulation : function (note, element) {
      var i, j, k, articCode, vexArtic, articElement, place;

      articElement = element.getAttribute('artic');

      if (articElement !== null) {

        var artics = articElement.split(' ');

        for (k=0;k<artics.length;k++) {
          place = element.getAttribute('place');
          articCode = (place==='below') ? Tables.articulationsBelow[artics[k]] : Tables.articulations[artics[k]];

          if (articCode) {
            vexArtic = null;
            for (i = 0, j = note.modifiers.length; i < j; i++) {
              if (note.modifiers[i].type === articCode) {
                vexArtic = note.modifiers[i];
                break;
              }
            }
            if (vexArtic) {
              vexArtic.addMeiElement(element);
            } else {
              vexArtic = new Articulation(articCode).addMeiElement(element);
              if (place) {
                vexArtic.setPosition(Tables.positions[place]);
              } else{
                // sets position to null; null positions are set in Articulation.draw()
                vexArtic.setPosition(null);
              }
              note.addArticulation(0, vexArtic);
            }
          } else {
            Logger.info('unknown @artic', 'The @artic attribute in ' + Util.serializeElement(element) +
                                          ' is unknown. Ignoring articulation.');
          }
        }
      } else {
        Logger.warn('Missing attribute', Util.serializeElement(element) +
                                         ' does not have an @artic attribute. Ignoring articulation.');
      }
    },

    addFermataAtt : function (note, element, place, index) {
      var me = this;
      var vexPlace = Tables.fermata[place];
      me.addNewFermata(note, element, place, index, vexPlace);
    },

    /**
     * adds a fermata to a note-like object
     * @method addFermataAtt
     * @param {Vex.Flow.StaveNote} note the note-like VexFlow object
     * @param {Element} element the element containing the fermata specifications
     * @param {'above'/'below'} place The place of the fermata
     * @param {Number} index The index of the note in a chord (optional)
     */
    addFermata : function (note, element, place, index) {
      var me = this, i, j, vexArtic = null, vexPlace;
      vexPlace = Tables.fermata[place];
      for (i = 0, j = note.modifiers.length; i < j; i++) {
        if (note.modifiers[i].type === vexPlace) {
          vexArtic = note.modifiers[i];
          break;
        }
      }
      if (vexArtic) {
        vexArtic.addMeiElement(element);
      } else {
        me.addNewFermata(note, element, place, index, vexPlace);
      }
    },

    addNewFermata : function (note, element, place, index, articCode) {
      var vexArtic = new Articulation(articCode);
      vexArtic.setPosition(Tables.positions[place]);
      vexArtic.addMeiElement(element);
      note.addArticulation(index || 0, vexArtic);
    },

    addStemModifier : function (note, element, stemMod) {
      var n = parseInt(stemMod, 10);
      if (n) {
        note.addArticulation(0, new VF.Tremolo(n));
      } else {
        Logger.info('Not supported', 'The value of @stem.mod="' + stemMod + '" specified in ' +
                                     Util.serializeElement(element) + ' is not supported. Ignoring attribute');
      }
    },

    addClefModifier : function (vexNote, prop) {
      var clef = new VF.ClefNote(prop.type, 'small', prop.shift === -1 ? '8vb' : undefined);
      clef.setMeiElement(prop.meiElement);
      vexNote.addModifier(0, new VF.GraceNoteGroup([clef], false));
      clef.setOffsetLeft(25);
    },

    /**
     * @method setStemDir
     * @param options
     * @param vexOptions
     * @return {Boolean} true if a stem direction has been specified in the MEI code
     */
    setStemDir : function (options, vexOptions) {
      var specified_dir = this.DIR[options.atts['stem.dir']];
      if (specified_dir) {
        vexOptions.stem_direction = specified_dir;
        return true;
      } else if (options.layerDir) {
        vexOptions.stem_direction = options.layerDir;
        return false;
      } else {
        vexOptions.auto_stem = true;
        return false;
      }
    },

    setCueSize: function () {
      this.render_options.glyph_font_scale = 22;
      this.render_options.stem_height = 20;
      this.render_options.stroke_px = 2;
      this.glyph.head_width = 6;
      this.buildNoteHeads();
      this.width = 3;
    }


  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var Note = function (options) {
    var me = this, dots, i, j, element = options.element, atts = options.atts;

    var vexOptions = {
      keys : [options.vexPitch],
      duration : EventUtil.processAttsDuration(element, atts),
      clef : options.clef.type,
      octave_shift : options.clef.shift
    };

    this.hasMeiStemDir = EventUtil.setStemDir(options, vexOptions);


    VF.StaveNote.call(this, vexOptions);

    if (atts.size === 'cue') {
      EventUtil.setCueSize.call(this);
    }

    dots = +atts.dots || 0;
    for (i = 0; i < dots; i += 1) {
      this.addDotToAll();
    }

    this.setStave(options.stave);


    // TODO artic attribute

    var childNodes = element.childNodes;
    for (i = 0, j = childNodes.length; i < j; i++) {
      switch (childNodes[i].localName) {
        case 'accid':
          atts.accid = childNodes[i].getAttribute('accid');
          break;
        case 'artic':
          EventUtil.addArticulation(me, childNodes[i]);
          break;
        default:
          break;
      }
    }

    if (atts.accid) {
      EventUtil.processAttrAccid(atts.accid, this, 0);
    }
    if (atts.artic) {
      EventUtil.addArticulation(me, element);
    }
    if (atts.ho) {
      EventUtil.processAttrHo(atts.ho, this, options.stave);
    }
    if (atts.fermata) {
      EventUtil.addFermataAtt(this, element, atts.fermata);
    }
    if (atts['stem.mod']) {
      EventUtil.addStemModifier(this, element, atts['stem.mod']);
    }


  };

  Note.prototype = Object.create(VF.StaveNote.prototype);

  Note.prototype.beamable = true;
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var GraceNote = function (options) {
    var me = this, dots, i, j, element = options.element, atts = options.atts;

    var vexOptions = {
      keys : [options.vexPitch],
      duration : EventUtil.processAttsDuration(element, options.atts),
      clef : options.clef.type,
      octave_shift : options.clef.shift
    };

    this.hasMeiStemDir = EventUtil.setStemDir(options, vexOptions);


    VF.GraceNote.call(this, vexOptions);


    dots = +options.atts.dots || 0;
    for (i = 0; i < dots; i += 1) {
      this.addDotToAll();
    }

    this.slash = options.atts['stem.mod'] === '1slash';

    this.setStave(options.stave);

    var childNodes = element.childNodes;
    for (i = 0, j = childNodes.length; i < j; i++) {
      switch (childNodes[i].localName) {
        case 'accid':
          atts.accid = childNodes[i].getAttribute('accid');
          break;
        case 'artic':
          EventUtil.addArticulation(me, childNodes[i]);
          break;
        default:
          break;
      }
    }

    if (atts.accid) {
      EventUtil.processAttrAccid(atts.accid, this, 0);
    }
    if (atts.artic) {
      EventUtil.addArticulation(me, element);
    }
    if (atts.ho) {
      EventUtil.processAttrHo(atts.ho, this, options.stave);
    }
    if (atts.fermata) {
      EventUtil.addFermataAtt(this, element, atts.fermata);
    }


  };

  GraceNote.prototype = Object.create(VF.GraceNote.prototype);

  GraceNote.prototype.grace = true;
  //GraceNote.prototype.beamable = false;
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var Chord = function (options) {

    var me = this, atts = options.atts, element = options.element;
    var durAtt, durations = [], duration, keys = [], i, j, noteElements, dots;

    noteElements = options.noteElements;

    durAtt = atts.dur;

    if (durAtt) {
      duration = EventUtil.processAttsDuration(element, atts);
      dots = +atts.dots || 0;
      for (i = 0, j = noteElements.length; i < j; i += 1) {
        keys.push(EventUtil.getVexPitch(noteElements[i]));
      }
    } else {
      for (i = 0, j = noteElements.length; i < j; i += 1) {
        durations.push(+noteElements[i].getAttribute('dur'));
        dots = +noteElements[i].getAttribute('dots') || 0;
        keys.push(EventUtil.getVexPitch(noteElements[i]));
      }
      duration = EventUtil.translateDuration(element, Math.max.apply(Math, durations));
      for (i = 0; i < dots; i += 1) {
        duration += 'd';
      }
    }


    var vexOptions = {
      keys : keys,
      duration : duration,
      clef : options.clef.type,
      octave_shift : options.clef.shift
    };

    this.hasMeiStemDir = EventUtil.setStemDir(options, vexOptions);


    VF.StaveNote.call(this, vexOptions);

    if (atts.size === 'cue') {
      EventUtil.setCueSize.call(this);
    }


    for (i = 0; i < dots; i += 1) {
      this.addDotToAll();
    }

    this.setStave(options.stave);

    if (atts.ho) {
      EventUtil.processAttrHo(atts.ho, me, options.stave);
    }

    var articElements = element.getElementsByTagName('artic');
    for (i = 0, j = articElements.length; i < j; i++) {
      EventUtil.addArticulation(me, articElements[i]);
    }
    if (atts.artic) {
      EventUtil.addArticulation(me, element);
    }

    if (atts.fermata) {
      EventUtil.addFermataAtt(me, element, atts.fermata);
    }
    if (atts['stem.mod']) {
      EventUtil.addStemModifier(this, element, atts['stem.mod']);
    }

  };

  Chord.prototype = Object.create(VF.StaveNote.prototype);

  Chord.prototype.beamable = true;
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var GraceChord = function (options) {
    var me = this, atts = options.atts, element = options.element;
    var durAtt, durations = [], duration, keys = [], i, j, noteElements, dots;

    noteElements = options.noteElements;

    durAtt = atts.dur;

    if (durAtt) {
      duration = EventUtil.processAttsDuration(element, atts);
      dots = +atts.dots || 0;
      for (i = 0, j = noteElements.length; i < j; i += 1) {
        keys.push(EventUtil.getVexPitch(noteElements[i]));
      }
    } else {
      for (i = 0, j = noteElements.length; i < j; i += 1) {
        durations.push(+noteElements[i].getAttribute('dur'));
        dots =+noteElements[i].getAttribute('dots') || 0;
        keys.push(EventUtil.getVexPitch(noteElements[i]));
      }
      duration = EventUtil.translateDuration(element, Math.max.apply(Math, durations));
      for (i = 0; i < dots; i += 1) {
        duration += 'd';
      }
    }


    var vexOptions = {
      keys : keys,
      duration : duration,
      clef : options.clef.type,
      octave_shift : options.clef.shift
    };

    this.hasMeiStemDir = EventUtil.setStemDir(options, vexOptions);

    VF.GraceNote.call(this, vexOptions);


    for (i = 0; i < dots; i += 1) {
      this.addDotToAll();
    }



    this.slash = atts['stem.mod'] === '1slash';

    this.setStave(options.stave);

    if (atts.ho) {
      EventUtil.processAttrHo(atts.ho, me, options.stave);
    }

    var articElements = element.getElementsByTagName('artic');
    for (i=0,j=articElements.length;i<j;i++) {
      EventUtil.addArticulation(me, articElements[i]);
    }
    if (atts.artic) {
      EventUtil.addArticulation(me, element);
    }

    if (atts.fermata) {
      EventUtil.addFermataAtt(me, element, atts.fermata);
    }

  };

  GraceChord.prototype = Object.create(VF.GraceNote.prototype);

  GraceChord.prototype.grace = true;
//  GraceChord.prototype.beamable = true;
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var Rest = function (options) {
    var dots, i, vexOptions, atts;

    atts = Util.attsToObj(options.element);


    var duration = EventUtil.processAttsDuration(options.element, atts) + 'r';

    if (options.clef) {
      vexOptions = {
        duration: duration,
        keys : [atts.ploc + '/' + atts.oloc],
        clef : options.clef.type,
        octave_shift : options.clef.shift
      }
        this.manualPosition = true;
    } else {
      vexOptions = {
        duration: duration,
        keys : [(atts.dur === '1') ? 'd/5' : 'b/4']
      }
    }


    VF.StaveNote.call(this, vexOptions);

    if (atts.size === 'cue') {
      EventUtil.setCueSize.call(this);
    }


    dots = +atts.dots || 0;
    for (i = 0; i < dots; i += 1) {
      this.addDotToAll();
    }

    this.setStave(options.stave);

    if (atts.ho) {
      EventUtil.processAttrHo(atts.ho, this, options.stave);
    }

    if (atts.fermata) {
      EventUtil.addFermataAtt(this, options.element, atts.fermata);
    }

  };

  Rest.prototype = Object.create(VF.StaveNote.prototype);

  Rest.prototype.beamable = true;
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var MRest = function (options) {
    var dots, i, vexOptions, atts;

    atts = Util.attsToObj(options.element);

    var duration = new VF.Fraction(options.meter.count, options.meter.unit);
    var dur, keys;
    if (duration.value() == 2) {
      dur = Tables.durations['breve'];
      keys = ['b/4'];
    } else if (duration.value() == 4) {
      dur = Tables.durations['long'];
      keys = ['b/4']
    } else {
      dur = 'w';
      keys = ['d/5'];
    }


//    if (options.clef) {
//      vexOptions.keys = [atts.ploc + '/' + atts.oloc];
//      vexOptions.clef = me.systemInfo.getClef(stave_n);
//    } else {
//      vexOptions.keys = keys;
//    }

    if (options.clef) {
      vexOptions = {
        align_center : true,
        duration : dur + 'r',
        duration_override : duration,

        keys : [atts.ploc + '/' + atts.oloc],
        clef : options.clef.type,
        octave_shift : options.clef.shift
      };
    } else {
      vexOptions = {
        align_center : true,
        duration : dur + 'r',
        duration_override : duration,

        keys : keys
      };
    }

    VF.StaveNote.call(this, vexOptions);

    if (atts.size === 'cue') {
      EventUtil.setCueSize.call(this);
    }


    dots = +atts.dots || 0;
    for (i = 0; i < dots; i += 1) {
      this.addDotToAll();
    }

    this.setStave(options.stave);

    if (atts.ho) {
      EventUtil.processAttrHo(atts.ho, this, options.stave);
    }

    if (atts.fermata) {
      EventUtil.addFermataAtt(this, options.element, atts.fermata);
    }

  };

  MRest.prototype = Object.create(VF.StaveNote.prototype);

  MRest.prototype.beamable = true;
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var Space = function (options) {
    var vexOptions, atts;

    atts = Util.attsToObj(options.element);


    vexOptions = {
      duration: EventUtil.processAttsDuration(options.element, atts) + 'r'
    };

    VF.GhostNote.call(this, vexOptions);

    this.setStave(options.stave);

  };

  Space.prototype = Object.create(VF.GhostNote.prototype);

  Space.prototype.beamable = true;

  /*
   * meilib.js
   *
   * Author: Zoltan Komives Created: 05.07.2013
   *
   * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
   * University of Maryland
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not
   * use this file except in compliance with the License. You may obtain a copy of
   * the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
   * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
   * License for the specific language governing permissions and limitations under
   * the License.
   */
  /**
   * Contributor: Alexander Erhard
   */
  /**
   * @class MeiLib
   * MeiLib - General purpose JavaScript functions for processing MEI documents.
   * @singleton
   */

  if (!window.MeiLib) window.MeiLib = {};

  /**
   * @method createPseudoUUID
   */
  MeiLib.createPseudoUUID = function () {
    return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).substr(-4)
  };

  /**
   * @method durationOf
   * Calculate the duration of an event (number of beats) according to the given
   * meter.
   *
   * Event refers to musical event such as notes, rests, chords. The MEI element
   * <b>space</b> is also considered an event.
   *
   * @param evnt an XML DOM object
   * @param meter the time signature object { count, unit }
   * @param {Boolean} zeroGraceNotes Specifies if all grace notes should return the duration 0
   */
  MeiLib.durationOf = function (evnt, meter, zeroGraceNotes) {

    var IsZeroDurEvent = zeroGraceNotes ? function (evnt, tagName) {
      return evnt.hasAttribute('grace') || tagName === 'clef';
    } : function (evnt, tagName) {
      return tagName === 'clef';
    };

    var isSimpleEvent = function (tagName) {
      return (tagName === 'note' || tagName === 'rest' || tagName === 'space');
    };

    var durationOf_SimpleEvent = function (simple_evnt, meter) {
      var dur = simple_evnt.getAttribute('dur');
      if (!dur) {
        console.warn('@dur of <b>note</b>, <b>rest</b> or <b>space</b> must be specified. Proceeding with default @dur="4". Element:');
        console.log(simple_evnt);
        dur = "4";
        //      throw new MeiLib.RuntimeError('MeiLib.durationOf:E04', '@dur of <b>note</b>, <b>rest</b> or <b>space</b> must be specified.');
      }
      //    console.log(MeiLib.dotsMult(simple_evnt) * MeiLib.dur2beats(Number(dur), meter));
      return MeiLib.dotsMult(simple_evnt) * MeiLib.dur2beats(Number(dur), meter);
    };

    var durationOf_Chord = function (chord, meter, layer_no) {
      var i, j, childNodes, note;
      if (!layer_no) {
        layer_no = "1";
      }
      var dur = chord.getAttribute('dur');
      var dotsMult = MeiLib.dotsMult(chord);
      if (dur) {
        return dotsMult * MeiLib.dur2beats(Number(dur), meter);
      }
      childNodes = chord.childNodes;
      for (i = 0, j = childNodes.length; i < j; i++) {
        if (childNodes[i].localName === 'note') {
          note = childNodes[i];
          var lyr_n = note.getAttribute('layer');
          if (!lyr_n || lyr_n === layer_no) {
            var dur_note = note.getAttribute('dur');
            var dotsMult_note = MeiLib.dotsMult(chord);
            if (!dur && dur_note) {
              dur = dur_note;
              dotsMult = dotsMult_note;
            } else if (dur && dur != dur_note) {
              throw new MeiLib.RuntimeError('MeiLib.durationOf:E05', 'duration of <chord> is ambiguous. Element: ' +
                                                                     Util.serializeElement(chord));
            }
          }
        }
      }

      if (!dur) {
        throw new MeiLib.RuntimeError('MeiLib.durationOf:E06', '@dur of chord must be specified either in <chord> or in at least one of its <note> elements. Proceeding with default @dur="4". Element:' +
                                                               Util.serializeElement(chord));
      }
      return dotsMult * MeiLib.dur2beats(Number(dur), meter);
    };

    var durationOf_Beam = function (beam, meter) {
      var acc = 0, i, j, childNodes, childNode;
      childNodes = beam.childNodes;
      for (i = 0, j = childNodes.length; i < j; i++) {
        childNode = childNodes[i];
        var dur_b;
        var tagName = childNode.localName;
        if (IsZeroDurEvent(childNode, tagName)) {
          dur_b = 0;
        } else if (isSimpleEvent(tagName)) {
          dur_b = durationOf_SimpleEvent(childNode, meter);
        } else if (tagName === 'chord') {
          dur_b = durationOf_Chord(childNode, meter);
        } else if (tagName === 'beam') {
          dur_b = durationOf_Beam(childNode, meter);
        } else if (tagName === 'tuplet') {
          dur_b = durationOf_Tuplet(childNode, meter);
        } else {
          dur_b = 0;
          //throw new MeiLib.RuntimeError('MeiLib.durationOf:E03', "Not supported element '" + tagName + "'");
        }
        acc += dur_b;
      }
      return acc;
    };

    var durationOf_Tuplet = function (tuplet, meter) {
      // change the meter unit according to the ratio in the tuplet, the get the duration as if the tuplet were a beam
      var num = +tuplet.getAttribute('num') || 3;
      var numbase = +tuplet.getAttribute('numbase') || 2;
      return durationOf_Beam(tuplet, {
        count : meter.count,
        unit : meter.unit * numbase / num
      });
    };

    var evnt_name = evnt.localName;
    if (IsZeroDurEvent(evnt, evnt_name)) {
      return 0;
    }
    if (isSimpleEvent(evnt_name)) {
      return durationOf_SimpleEvent(evnt, meter);
    }
    if (evnt_name === 'mRest') {
      return meter.count;
    }
    if (evnt_name === 'chord') {
      return durationOf_Chord(evnt, meter);
    }
    if (evnt_name === 'beam') {
      return durationOf_Beam(evnt, meter);
    }
    if (evnt_name === 'tuplet') {
      return durationOf_Tuplet(evnt, meter);
    }
    return 0;
    //throw new MeiLib.RuntimeError('MeiLib.durationOf:E05', "Not supported element: '" + evnt_name + "'");

  };
  /**
   * @method tstamp2id
   * Find the event with the minimum distance from of the given timestamp.
   *
   * @param {String} tstamp the timestamp to match against events in the given
   * context. Local timestamp only (without measure part).
   * @param {Object} layer an XML DOM object, contains all events in the given
   * measure.
   * @param {Object} meter the effective time signature object { count, unit } in
   * the measure containing layer.
   * @return {String} the xml:id of the closest element, or
   * undefined if <b>layer</b> contains no events.
   */
  MeiLib.tstamp2id = function (tstamp, layer, meter) {
    var ts = Number(tstamp);
    var ts_acc = 0;
    // total duration of events before current event
    var c_ts = function () {
      return ts_acc + 1;
    };// tstamp of current event
    var distF = function () {
      return ts - c_ts();
    };// signed distance between tstamp and tstamp of current event;
    var eventList = new MeiLib.EventEnumerator(layer);
    var evnt;
    var dist;
    var prev_evnt = null;
    // previous event
    var prev_dist;
    // previous distance
    while (!eventList.EoI && (dist === undefined || dist > 0)) {
      prev_evnt = evnt;
      prev_dist = dist;
      evnt = eventList.nextEvent();
      dist = distF();
      if (!evnt.hasAttribute('grace') && evnt.localName !== 'clef') {
        ts_acc +=
        MeiLib.durationOf(evnt, meter, true) * eventList.outputProportion.numbase / eventList.outputProportion.num;
      }
      //    m = meter;
      //    e = evnt;
    }

    if (dist === undefined) {
      return undefined;
    }
    var winner;
    if (dist < 0) {
      if (prev_evnt && prev_dist < Math.abs(dist)) {
        winner = prev_evnt;
      } else {
        winner = evnt;
      }
    } else {
      winner = evnt;
    }

    var getFullNote = function (evnt) {
      if (evnt.hasAttribute('grace') || evnt.localName === 'clef') {
        return getFullNote(eventList.nextEvent()) || evnt;
      }
      return evnt;
    };

    winner = getFullNote(winner);

    var xml_id;
    xml_id = winner.getAttribute('xml:id');
    if (!xml_id) {
      xml_id = MeiLib.createPseudoUUID();
      winner.setAttribute('xml:id', xml_id);
    }
    return xml_id;
  };
  /**
   * @method XMLID
   * returns the xml:id attribute of an element; if there is none, the function
   * created a pseudo id, adds it to the element and returns that id.
   * @param {Element} elem the element to process
   * @return {String} the xml:id of the element
   */
  MeiLib.XMLID = function (elem) {
    var xml_id = elem.getAttribute('xml:id');
    if (!xml_id) {
      xml_id = MeiLib.createPseudoUUID();
      elem.setAttribute('xml:id', xml_id);
    }
    return xml_id;
  };
  /**
   * @method id2tstamp
   * Calculates a timestamp value for an event in a given context. (Event refers
   * to musical events such as notes, rests and chords).
   *
   * @param eventid {String} the xml:id of the event
   * @param context {Array} of contextual objects {layer, meter}. Time signature
   * is mandatory for the first one, but optional for the rest. All layers belong
   * to a single logical layer. They are the layer elements from some consequtive
   * measures.
   * @return {String} the MEI timestamp value (expressed in beats relative to the
   * meter of the measure containing the event) of all events that happened before
   * the given event in the given context. If the event is not in the first
   * measure (layer) the timestamp value contains a 'measure part', that is for
   * example 2m+2 if the event is at the second beat in the 3rd measure.
   */
  MeiLib.id2tstamp = function (eventid, context) {
    var meter;
    var found = false;
    for (var i = 0; i < context.length && !found; ++i) {
      if (context[i].meter) {
        meter = context[i].meter;
      }
      if (i === 0 && !meter) {
        throw new MeiLib.RuntimeError('MeiLib.id2tstamp:E001', 'No time signature specified');
      }

      var result = MeiLib.sumUpUntil(eventid, context[i].layer, meter);
      if (result.found) {
        found = true;
        return i.toString() + 'm' + '+' + (result.beats + 1).toString();
      }
    }
    throw new MeiLib.RuntimeError('MeiLib.id2tstamp:E002', 'No event with xml:id="' + eventid +
                                                           '" was found in the given MEI context.');
  };

  /**
   * @method dur2beats
   * Convert absolute duration into relative duration (nuber of beats) according
   * to time signature.
   *
   * @param dur {Number} reciprocal value of absolute duration (e.g. 4->quarter
   * note, 8->eighth note, etc.)
   * @param {Object} meter the time signature object { count, unit }
   * @return {Number}
   */
  MeiLib.dur2beats = function (dur, meter) {
    return (meter.unit / dur);
  };
  /**
   * @method beats2dur
   * Convert relative duration (nuber of beats) into absolute duration (e.g.
   * quarter note, eighth note, etc) according to time signature.
   *
   * @param beats {Number} duration in beats @param meter time signature object {
 * count, unit } @return {Number} reciprocal value of absolute duration (e.g. 4
   * -> quarter note, 8 -> eighth note, etc.)
   * @param {Object} meter
   */
  MeiLib.beats2dur = function (beats, meter) {
    return (meter.unit / beats);
  };
  /**
   * @method dotsMult
   * Converts the <b>dots</b> attribute value into a duration multiplier.
   *
   * @param node XML DOM object containing a node which may have <code>dots</code>
   * attribute
   * @return {Number} The result is 1 if no <code>dots</code> attribute is present.
   * For <code>dots="1"</code> the result is 1.5, for <code>dots="2"</code> the
   * result is 1.75, etc.
   */
  MeiLib.dotsMult = function (node) {
    var dots = node.getAttribute('dots');
    dots = Number(dots || "0");
    var mult = 1;
    for (; dots > 0; --dots) {
      mult += (1 / Math.pow(2, dots))
    }
    return mult;
  };
  /**
   * @method sumUpUntil
   * For a given event (such as note, rest chord or space) calculates the combined
   * length of preceding events, or the combined length of all events if the given
   * event isn't present.
   *
   * @param {String} eventid the value of the xml:id attribute of the event
   * @param {Object} layer an XML DOM object containing the MEI <b>Layer</b>
   * element
   * @param {Object} meter the time signature object { count, unit }
   * @return {Object} an object { beats:number, found:boolean }. 1. 'found' is true
   * and 'beats' is the total duration of the events that happened before the event
   * 'eventid' within 'layer', or 2. 'found' is false and 'beats is the total
   * duration of the events in 'layer'.
   */
  MeiLib.sumUpUntil = function (eventid, layer, meter) {

    var sumUpUntil_inNode = function (node) {
      var beats, children, found = null, dur, dots, subtotal, chord_dur, i;
      var node_name = node.localName;
      if (node.hasAttribute('grace') || node_name === 'clef') {
        return {
          beats : 0,
          found : (node.getAttribute('xml:id') === eventid)
        };
      }
      if (node_name === 'note' || node_name === 'rest') {
        if (node.getAttribute('xml:id') === eventid) {
          return {
            beats : 0,
            found : true
          };
        } else {
          dur = Number(node.getAttribute('dur'));
          if (!dur) {
            throw new MeiLib.RuntimeError('MeiLib.sumUpUntil:E001', "Duration is not a number ('breve' and 'long' are not supported).");
          }
          dots = node.getAttribute('dots');
          dots = Number(dots || "0");
          beats = MeiLib.dotsMult(node) * MeiLib.dur2beats(dur, meter);

          return {
            beats : beats,
            found : false
          };
        }
      } else if (node_name === 'mRest') {
        if (node.getAttribute('xml:id') === eventid) {
          return {
            beats : 0,
            found : true
          };
        } else {
          return {
            beats : meter.count,
            found : false
          };
          // the duration of a whole bar expressed in number of beats.
        }
      } else if (node_name === 'layer' || node_name === 'beam' || node_name === 'tuplet') {

        // sum up childrens' duration
        beats = 0;
        children = node.childNodes;
        found = false;
        for (i = 0; i < children.length && !found; ++i) {
          if (children[i].nodeType === 1) {
            subtotal = sumUpUntil_inNode(children[i]);
            beats += subtotal.beats;
            found = subtotal.found;
          }
        }
        return {
          beats : beats,
          found : found
        };
      } else if (node_name === 'chord') {
        chord_dur = node.getAttribute('dur');
        if (node.getAttribute('xml:id') === eventid) {
          return {
            beats : 0,
            found : true
          };
        } else {
          // ... or find the longest note in the chord ????
          chord_dur = node.getAttribute('dur');
          if (chord_dur) {
            //            if (node.querySelector("[*|id='" + eventid + "']")) {
            if ($(node).find("[xml\\:id='" + eventid + "']").length) {
              return {
                beats : 0,
                found : true
              };
            } else {
              return {
                beats : MeiLib.dur2beats(chord_dur, meter),
                found : found
              };
            }
          } else {
            children = node.childNodes;
            found = false;
            for (i = 0; i < children.length && !found; ++i) {
              if (children[i].nodeType === 1) {
                subtotal = sumUpUntil_inNode(children[i]);
                beats = subtotal.beats;
                found = subtotal.found;
              }
            }
            return {
              beats : beats,
              found : found
            };
          }
        }
      }
      return {
        beats : 0,
        found : false
      };
    };

    return sumUpUntil_inNode(layer);
  };
/*
 * EventReference.js Author: Zoltan Komives (zolaemil@gmail.com) Created:
 * 04.07.2013
 *
 * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



  /**
   * @class MEI2VF.EventReverence
   * Represents and event with its xmlid, but if the xmlid is not defined, it
   * can also hold the timestamp that can be resolved as soon as the context
   * that holds the event is established. When the tstamp reference is being
   * resolved, the xml:id is calculated using the generic function tstamp2id(),
   * then the xml:id stored, thus marking that the reference is resolved.
   * @private
   *
   * @constructor
   * @param {String} xmlid
   */
  var EventReference = function (xmlid) {
    this.xmlid = xmlid;
  };

  EventReference.prototype = {

    /**
     * @public
     * @param xmlid
     */
    setId : function (xmlid) {
      this.xmlid = xmlid;
    },

    /**
     * @public
     * @param tstamp
     */
    setTStamp : function (tstamp) {
      this.tstamp = tstamp;
      if (this.xmlid) {
        // parameter not used in callee:
        this.tryResolveReference(true);
      }
    },

    /**
     * @private
     */
    tryResolveReference : function () {
      var tstamp;
      tstamp = this.tstamp;
      if (!tstamp) {
        throw new RuntimeError('tstamp must be set in order to resolve reference.');
      }
      if (this.meicontext) {
        // look up event corresponding to the given tstamp (strictly or losely)
        this.xmlid = MeiLib.tstamp2id(this.tstamp, this.meicontext.layer, this.meicontext.meter);
      } else {
        this.xmlid = null;
      }
    },

    /**
     * @param params {
     *            meicontext, strict }; both parameters are optional;
     *            meicontext is an obejct { layer, meter }; strict is
     *            boolean, false if not defined.
     *
     */
    getId : function (params) {
      if (params && params.meicontext) {
        this.setContext(params.meicontext);
      }
      if (this.xmlid) {
        return this.xmlid;
      }
      if (this.tstamp && this.meicontext) {
        // look up the closest event to tstamp within
        // this.meicontext and return its ID

        // parameter not used in callee:
        this.tryResolveReference(params && params.strict);
        return this.xmlid;
      }
      return null;
    },

    /**
     * @public
     * @param meicontext
     */
    setContext : function (meicontext) {
      this.meicontext = meicontext;
    }
  };
/*
 * EventLink.js Author: Zoltan Komives (zolaemil@gmail.com) Created: 04.07.2013
 *
 * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */




  /**
   * @class MEI2VF.EventLink
   * @private
   * Represents a link between two MEI events. The link is represented by two
   * references:
   *
   * 1. reference to start event,
   * 2. reference to end event.
   *
   * @constructor
   * @param {String} first_id
   * @param {String} last_id
   */
  var EventLink = function (first_id, last_id) {
    this.init(first_id, last_id);
  };

  EventLink.prototype = {
    init : function (first_id, last_id) {
      this.first_ref = new EventReference(first_id);
      this.last_ref = new EventReference(last_id);
      this.params = {};
    },

    /**
     * @param {Object} params
     *            is an object. for ties and slurs { linkCond } to indicate
     *            the linking condition when parsing from attributes (pitch
     *            name for ties, nesting level for slurs); for hairpins
     *            params it is an object { place, form }
     */
    setParams : function (params) {
      this.params = params;
    },

    setMeiElement : function (element) {
      this.meiElement = element;
    },

    getMeiElement : function () {
      return this.meiElement;
    },

    setFirstRef : function (first_ref) {
      this.first_ref = first_ref;
    },

    setLastRef : function (last_ref) {
      this.last_ref = last_ref;
    },

    setFirstId : function (id) {
      this.first_ref.setId(id);
    },

    setLastId : function (id) {
      this.last_ref.setId(id);
    },

    setFirstTStamp : function (tstamp) {
      this.first_ref.setTStamp(tstamp);
    },

    setLastTStamp : function (tstamp2) {
      this.last_ref.setTStamp(tstamp2);
    },

    setContext : function (meicontext) {
      this.meicontext = meicontext;
    },

    getFirstId : function () {
      return this.first_ref.getId({
        meicontext : this.meicontext
      });
    },

    getLastId : function () {
      return this.last_ref.getId({
        meicontext : this.meicontext
      });
    }
  };
/*
 * MEItoVexFlow, EventLinkCollection class
 *
 * Author: Alexander Erhard
 * (based on meitovexflow.js)
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class EventLinkCollection
   * @private
   *
   * @constructor
   */
  var EventLinkCollection = function (systemInfo, unresolvedTStamp2) {
    this.init(systemInfo, unresolvedTStamp2);
  };

  EventLinkCollection.prototype = {

    /**
     * initializes the EventLinkCollection
     */
    init : function (systemInfo, unresolvedTStamp2) {
      /**
       * @property
       */
      this.allVexObjects = [];
      /**
       * @property
       */
      this.allModels = [];
      /**
       * @property
       */
      this.systemInfo = systemInfo;
      /**
       * @property
       */
      this.unresolvedTStamp2 = unresolvedTStamp2;
    },

    validateAtts : function () {
      throw new RuntimeError('You have to provide a validateAtts() method when inheriting MEI2VF.EventLinkCollection.');
    },

    createVexFromInfos : function () {
      throw new RuntimeError('You have to provide a createVexFromInfos method when inheriting MEI2VF.EventLinkCollection.');
    },

    /**
     * create EventLink objects from  <b>tie</b>, <b>slur</b> or <b>hairpin</b>
     * elements
     */
    createInfos : function (link_elements, measureElement, measureIndex, systemInfo) {
      var me = this;

      var link_staveInfo = function (lnkelem) {
        return {
          stave_n : lnkelem.getAttribute('staff') || '1',
          layer_n : lnkelem.getAttribute('layer') || '1'
        };
      };

      // convert tstamp into startid in current measure
      var local_tstamp2id = function (tstamp, lnkelem, measureElement) {

        var stffinf = link_staveInfo(lnkelem);
        var stave = measureElement.querySelector('staff[n="' + stffinf.stave_n + '"]');
        if (!stave) {
          throw new RuntimeError('Cannot find staff @n="' + stffinf.stave_n + '" in ' +
                                 Util.serializeElement(measureElement));
        }
        var layer = stave.querySelector('layer[n="' + stffinf.layer_n + '"]');
        if (!layer) {
          var layer_candid = stave.getElementsByTagName('layer')[0];
          if (layer_candid && !layer_candid.hasAttribute('n')) {
            layer = layer_candid;
          }
          if (!layer) {
            throw new RuntimeError('Cannot find layer @n="' + stffinf.layer_n + '" in ' +
                                   Util.serializeElement(measureElement));
          }
        }
        var staveInfo = systemInfo.getStaveInfo(stffinf.stave_n);
        if (!staveInfo) {
          throw new RuntimeError('Cannot determine staff definition.');
        }
        var meter = staveInfo.getTimeSpec();
        if (!meter.count || !meter.unit) {
          throw new RuntimeError('Cannot determine meter; missing or incorrect @meter.count or @meter.unit.');
        }
        return MeiLib.tstamp2id(tstamp, layer, meter);
      };

      var measure_partOf = function (tstamp2) {
        return tstamp2.substring(0, tstamp2.indexOf('m'));
      };

      var beat_partOf = function (tstamp2) {
        return tstamp2.substring(tstamp2.indexOf('+') + 1);
      };

      var i, j, eventLink, element, atts, startid, tstamp, tstamp2, endid, measures_ahead;

      for (i = 0, j = link_elements.length; i < j; i++) {
        element = link_elements[i];

        eventLink = new EventLink(null, null);

        atts = Util.attsToObj(element);

        me.validateAtts(atts);

        eventLink.setParams(atts);
        eventLink.setMeiElement(element);

        // find startid for eventLink. if tstamp is provided in the
        // element, tstamp will be calculated.
        startid = atts.startid;
        if (startid) {
          eventLink.setFirstId(startid.substring(1));
        } else {
          tstamp = atts.tstamp;
          if (tstamp) {
            startid = local_tstamp2id(tstamp, element, measureElement);
            eventLink.setFirstId(startid);
          }
          // else {
          // // no @startid, no @tstamp ==> eventLink.first_ref
          // remains empty.
          // }
        }

        // find end reference value (id/tstamp) of eventLink:
        endid = atts.endid;
        if (endid) {
          eventLink.setLastId(endid.substring(1));
        } else {
          tstamp2 = atts.tstamp2;
          if (tstamp2) {
            measures_ahead = +measure_partOf(tstamp2);
            if (measures_ahead > 0) {
              eventLink.setLastTStamp(beat_partOf(tstamp2));
              // register that eventLink needs context;
              // need to save: measure.n, link.stave_n,
              // link.layer_n
              var staveInfo = link_staveInfo(element);
              var target_measure_n = measureIndex + measures_ahead;
              var refLocationIndex = target_measure_n + ':' + staveInfo.stave_n + ':' + staveInfo.layer_n;
              if (!me.unresolvedTStamp2[refLocationIndex]) {
                me.unresolvedTStamp2[refLocationIndex] = [];
              }
              me.unresolvedTStamp2[refLocationIndex].push(eventLink);
            } else {
              endid = local_tstamp2id(beat_partOf(tstamp2), element, measureElement);
              eventLink.setLastId(endid);
            }
          }
          // else {
          // // TODO no @endid, no @tstamp2 ==> eventLink.last_ref remains empty.
          // }
        }
        me.addModel(eventLink);
      }
    },

    /**
     * adds a new model to {@link #allModels}
     * @param {Object} obj the object to add
     */
    addModel : function (obj) {
      this.allModels.push(obj);
    },

    /**
     * gets all models
     * @return {Object[]} all models in {@link #allModels}
     */
    getModels : function () {
      return this.allModels;
    },

    /**
     * sets the context for the link collection
     * @param {Object} ctx the canvas context
     */
    setContext : function (ctx) {
      this.ctx = ctx;
      return this;
    },

    /**
     * draws the link collection to the canvas set by {@link #setContext}
     */
    draw : function () {
      var ctx = this.ctx, i, j, allVexObjects = this.allVexObjects;
      for (i = 0, j = allVexObjects.length; i < j; i++) {
        allVexObjects[i].setContext(ctx).draw();
      }
    }
  };
/*
 * MEItoVexFlow, Hairpins class
 * (based on meitovexflow.js)
 * Author of reworkings: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class Hairpins
   * @extend EventLinkCollection
   * @private
   *
   * @constructor
   */
  var Hairpins = function (systemInfo, unresolvedTStamp2) {
    this.init(systemInfo, unresolvedTStamp2);
  };

  Vex.Inherit(Hairpins, EventLinkCollection, {

    init : function (systemInfo, unresolvedTStamp2) {
      Hairpins.superclass.init.call(this, systemInfo, unresolvedTStamp2);
    },

    validateAtts : function (atts) {
      if (!atts.form) {
        throw new RuntimeError('@form is mandatory in <hairpin> - make sure the xml is valid.');
      }
    },

    createVexFromInfos : function (notes_by_id) {
      var me = this, f_note, l_note, i, j, model;
      for (i = 0, j = me.allModels.length; i < j; i++) {
        model = me.allModels[i];
        f_note = notes_by_id[model.getFirstId()] || {};
        l_note = notes_by_id[model.getLastId()] || {};

        if (f_note.system !== undefined && l_note.system !== undefined && f_note.system !== l_note.system) {
          me.createSingleHairpin(f_note, {}, model.params, model.getMeiElement());
          me.createSingleHairpin({}, l_note, model.params, model.getMeiElement());
        } else {
          me.createSingleHairpin(f_note, l_note, model.params, model.getMeiElement());
        }
      }
      return this;
    },

    createSingleHairpin : function (f_note, l_note, params, element) {
      var me = this, place, type, vex_options, hairpin;
      place = Tables.positions[params.place];
      type = Tables.hairpins[params.form];


      // TODO read from stave
      var stave_spacing = 10;


      if (!f_note.vexNote && !l_note.vexNote) {
        var param, paramString = '';
        for (param in params) {
          paramString += param + '="' + params[param] + '" ';
        }
        console.log(params);
        Logger.warn('Hairpin could not be processed', 'No haipin start or hairpin end could be found. Hairpin parameters: ' +
                                                      paramString + '. Skipping hairpin.');
        return true;
      }

      hairpin = new VF.StaveHairpin({
        first_note : f_note.vexNote,
        last_note : l_note.vexNote
      }, type);

      vex_options = {
        // processing of @opening skipped for aesthetic reasons
        //height : stave_spacing * (parseFloat(params.opening) || 1),
        height: stave_spacing,
        y_shift : 0,
        left_shift_px : 0,
        right_shift_px : 0
      };

      hairpin.setRenderOptions(vex_options);
      hairpin.setPosition(place);
      hairpin.setMeiElement(element);

      me.allVexObjects.push(hairpin);

    }
  });
/*
 * MEItoVexFlow, Ties class
 * (based on meitovexflow.js)
 * Author of reworkings: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



  /**
   * @class Ties
   * @extend EventLinkCollection
   * @private
   *
   * @constructor
   */

  var Ties = function (systemInfo, unresolvedTStamp2) {
    this.init(systemInfo, unresolvedTStamp2);
  };

  Vex.Inherit(Ties, EventLinkCollection, {

    init : function (systemInfo, unresolvedTStamp2) {
      Ties.superclass.init.call(this, systemInfo, unresolvedTStamp2);
    },

    validateAtts : function () {
    },

    // NB called from tie/slur attributes elements
    startTie : function (startid, linkCond) {
      var eventLink = new EventLink(startid, null);
      eventLink.setParams({
        linkCond : linkCond
      });
      this.allModels.push(eventLink);
    },

    terminateTie : function (endid, linkCond) {
      var cmpLinkCond, found, i, tie, allTies;

      allTies = this.getModels();

      cmpLinkCond = function (lc1, lc2) {
        return (lc1 && lc2 && lc1.vexPitch === lc2.vexPitch && lc1.stave_n === lc2.stave_n);
      };

      found = false;
      for (i = 0; !found && i < allTies.length; ++i) {
        tie = allTies[i];
        if (!tie.getLastId()) {
          if (cmpLinkCond(tie.params.linkCond, linkCond)) {
            found = true;
            tie.setLastId(endid);
          }
          // else {
          // // TODO in case there's no link condition set for the
          // link,
          // // we have to retreive the pitch of the referenced note.
          // // var note_id = tie.getFirstId();
          // // if (note_id) {
          // // var note = me.notes_by_id[note_id];
          // // if (note && cmpLinkCond(tie.params.linkCond,
          // // linkCond)) {
          // // found=true;
          // // tie.setLastId(endid);
          // // }
          // // }
          // }
        }
      }
      // if no tie object found that is uncomplete and with the same
      // pitch, then create a tie that has only endid set.
      if (!found) {
        this.addModel(new EventLink(null, endid));
      }
    },

    createVexFromInfos : function (notes_by_id) {
      var me = this, f_note, l_note, i, j,model;

      for (i=0,j=me.allModels.length;i<j;i++) {
        model = me.allModels[i];

        var keysInChord;
        f_note = notes_by_id[model.getFirstId()] || {};
        l_note = notes_by_id[model.getLastId()] || {};


        if (!f_note.vexNote && !l_note.vexNote) {
          var param, paramString = '';
          for (param in model.params) {
            paramString += param + '="' + model.params[param] + '" ';
          }
          console.log(model);
          Logger.warn('Tie could not be processed', 'No tie start or tie end could be found. Tie parameters: ' + paramString + '. Skipping tie.');
          return true;
        }

        // if the curve direction isn't specified in the model, calculate it:
        if (!model.params.curvedir) {
          var layerDir = f_note.layerDir || l_note.layerDir;
          // if a layer direction is specified, take this as basis for the curve direction
          if (layerDir) {
            model.params.curvedir = layerDir === -1 ? 'below' : layerDir === 1 ? 'above' : undefined;
          } else {
            // if the tie links to a note in a chord, let the outer ties of the
            // chord point outwards
            if (f_note.vexNote) {
              keysInChord = f_note.vexNote.keys.length;
              if (keysInChord > 1) {
                model.params.curvedir =
                (+f_note.index === 0) ? 'below' : (+f_note.index === keysInChord - 1) ? 'above' : undefined;
              }
            } else if (l_note.vexNote) {
              keysInChord = l_note.vexNote.keys.length;
              if (keysInChord > 1) {
                model.params.curvedir =
                +l_note.index === 0 ? 'below' : (+l_note.index === keysInChord - 1) ? 'above' : undefined;
              }
            }
          }
        }

        // if the tied notes belong to different staves, render a tie to each of the staves:
        if (f_note.system !== undefined && l_note.system !== undefined && f_note.system !== l_note.system) {
          me.createSingleTie(f_note, {}, model.params);
          if (!model.params.curvedir) {
            model.params.curvedir = (f_note.vexNote.getStemDirection() === -1) ? 'above' : 'below';
          }
          me.createSingleTie({}, l_note, model.params);
        } else {
          // ... otherwise render only one tie:
          me.createSingleTie(f_note, l_note, model.params);
        }
      }
      return this;
    },

    createSingleTie : function (f_note, l_note, params) {
      var me = this, vexTie;
      vexTie = new VF.StaveTie({
        first_note : f_note.vexNote,
        last_note : l_note.vexNote,
        first_indices : f_note.index,
        last_indices : l_note.index
      });

      if (params.curvedir) {
        vexTie.setDir((params.curvedir === 'above') ? -1 : 1);
      }
      if (f_note.vexNote && f_note.vexNote.grace === true) {
        vexTie.render_options.first_x_shift = -5;
      }
      me.allVexObjects.push(vexTie);
    }

  });
/*
 * MEItoVexFlow, Slurs class
 * (based on meitovexflow.js)
 * Author of reworkings: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



  /**
   * @class Slurs
   * @extend EventLinkCollection
   * @private
   *
   * @constructor
   */

  var Slurs = function (systemInfo, unresolvedTStamp2) {
    this.init(systemInfo, unresolvedTStamp2);
  };

  Vex.Inherit(Slurs, EventLinkCollection, {

    init : function (systemInfo, unresolvedTStamp2) {
      Slurs.superclass.init.call(this, systemInfo, unresolvedTStamp2);
    },

    validateAtts : function () {
    },

    // NB called from slur attributes elements
    startSlur : function (startid, linkCond) {
      var eventLink = new EventLink(startid, null);
      eventLink.setParams({
        linkCond : linkCond
      });
      this.allModels.push(eventLink);
    },

    terminateSlur : function (endid, linkCond) {
      var me = this, cmpLinkCond, found, i, slur;

      var allModels = this.getModels();

      cmpLinkCond = function (lc1, lc2) {
        return lc1.nesting_level === lc2.nesting_level;
      };

      found = false;
      for (i = 0; i < allModels.length; ++i) {
        slur = allModels[i];
        if (slur && !slur.getLastId() && cmpLinkCond(slur.params.linkCond, linkCond)) {
          slur.setLastId(endid);
          found = true;
          break;
        }
      }
      if (!found) {
        me.addModel(new EventLink(null, endid));
      }
    },

    createVexFromInfos : function (notes_by_id) {
      var me = this, f_note, l_note, i, j, model, bezier, params, curveDir, layerDir, slurOptions = {};

      var BELOW = -1;
      var ABOVE = 1;


      for (i = 0, j = me.allModels.length; i < j; i++) {
        model = me.allModels[i];
        params = model.params;
        curveDir = (params.curvedir === 'above') ? ABOVE : (params.curvedir === 'below') ? BELOW : null;

        f_note = notes_by_id[model.getFirstId()] || {};
        l_note = notes_by_id[model.getLastId()] || {};

        // Skip slurs where no vexNote could be found for both first and last note
        if (!f_note.vexNote && !l_note.vexNote) {
          var param, paramString = '';
          for (param in params) {
            paramString += param + '="' + params[param] + '" ';
          }
          console.log(model);
          Logger.warn('Slur could not be processed', 'No slur start or slur end could be found. Slur parameters: ' +
                                                     paramString + '. Skipping slur.');
          return true;
        }

        var firstStemDir, lastStemDir;
        if (f_note.vexNote) firstStemDir = f_note.vexNote.getStemDirection();
        if (l_note.vexNote) lastStemDir = l_note.vexNote.getStemDirection();
        layerDir = f_note.layerDir || l_note.layerDir;
        var firstDefinedStemDir = firstStemDir || lastStemDir;


        // TODO
        // STEPS :
        // 1) if bezier, use bezier, otherwise calculate curvedir
        // 2) if y shift, use y shift, otherwise calculate position


        // ### STEP 1: Determine curve and curve dir

        bezier = params.bezier;
        //ignore bezier for now!
        bezier = null;
        if (bezier) {
          slurOptions.cps = me.bezierStringToCps(bezier);
          slurOptions.custom_cps = true;
          // bezier overrrides @curvedir
          curveDir = (slurOptions.cps[0].y < 0) ? ABOVE : BELOW;
        } else {

          if (!curveDir) {
            // if no @curvedir is specified, set @curvedir according to the layer direction or to
            // the position of a note in a chord
            if (layerDir) {
              // if @layerdir is specified, set curveDir to @layerdir
              curveDir = layerDir;
            } else {
              // if the slur links to a note in a chord, let the outer slurs of the
              // chord point outwards

              // TODO adjust to slurs!!
              //              keysInChord = firstDefinedNote.vexNote.keys.length;
              //              if (keysInChord > 1) {
              //                curveDir = (+firstDefinedNote.index === 0) ? BELOW :
              //                           (+firstDefinedNote.index === keysInChord - 1) ? ABOVE : undefined;
              //              } else {
              //                curveDir = firstDefinedStemDir * -1;
              //              }

              curveDir = firstDefinedStemDir * -1;

            }
          }

          // adjust slurOptions to curveDir
          slurOptions.invert = !((curveDir === BELOW && lastStemDir === ABOVE) || (curveDir === ABOVE && lastStemDir === BELOW));

        }


        // TODO refactor: take stem-top and stem-bottom into account

        // ### STEP 2: Determine position

        var startvo = parseFloat(params.startvo);
        var endvo = parseFloat(params.endvo);

        // skip this for now
        startvo = null;

        if (startvo && endvo) {
          slurOptions.y_shift_start = startvo;
          slurOptions.y_shift_end = endvo;
        } else {

          if (!f_note.vexNote || !l_note.vexNote || !f_note.vexNote.hasStem() || !l_note.vexNote.hasStem()) {
            // always position at head when one of the notes doesn't have a stem
            slurOptions.position = VF.Curve.Position.NEAR_HEAD;
            slurOptions.position_end = VF.Curve.Position.NEAR_HEAD;

          } else if (firstStemDir === lastStemDir || !firstStemDir || !lastStemDir) {
            // same stem direction in both notes

            // shift slurs to stem end if stem direction equals curve direction
            if (firstDefinedStemDir === curveDir) {
              slurOptions.position = VF.Curve.Position.NEAR_TOP;
              slurOptions.position_end = VF.Curve.Position.NEAR_TOP;
            } else {
              slurOptions.position = VF.Curve.Position.NEAR_HEAD;
              slurOptions.position_end = VF.Curve.Position.NEAR_HEAD;
            }

          } else {
            // different direction in notes

            // change position
            if (firstDefinedStemDir === curveDir) {
              slurOptions.position = VF.Curve.Position.NEAR_TOP;
              slurOptions.position_end = VF.Curve.Position.NEAR_HEAD;
            } else {
              slurOptions.position = VF.Curve.Position.NEAR_HEAD;
              slurOptions.position_end = VF.Curve.Position.NEAR_TOP;
            }

          }

        }


        //
        //          var setPositionBasedOnDistance = function () {
        //            var firstNoteLine = f_note.vexNote.getLineNumber();
        //            var lastNoteLine = l_note.vexNote.getLineNumber();
        //            var distance = firstNoteLine - lastNoteLine;
        //            if (firstStemDir !== lastStemDir) {
        //              if ((firstStemDir === ABOVE && distance < -0.5 && curveDir === ABOVE) ||
        //                  (lastStemDir === BELOW && distance > 0.5 && curveDir === BELOW)) {
        //                slurOptions.position = VF.Curve.Position.NEAR_TOP;
        //                slurOptions.position_end = VF.Curve.Position.NEAR_HEAD;
        //              } else if ((distance > 0.5 && curveDir === ABOVE) || (distance < -0.5 && curveDir === BELOW)) {
        //                slurOptions.position_end = VF.Curve.Position.NEAR_TOP;
        //                //                slurOptions.position_end = VF.Curve.Position.NEAR_TOP;
        //              } else if (distance > 0.5 || distance < -0.5) {
        //                slurOptions.position = VF.Curve.Position.NEAR_HEAD;
        //                slurOptions.position_end = VF.Curve.Position.NEAR_HEAD;
        //              }
        //            } else {
        //              if (slurOptions.invert === true) {
        //                slurOptions.position = VF.Curve.Position.NEAR_TOP;
        //              }
        //            }
        //          };
        //
        //          if (curveDir && f_note.vexNote && l_note.vexNote && f_note.vexNote.duration !== 'w' &&
        //              l_note.vexNote.duration !== 'w') {
        //            // CURVEDIR SPECIFIED - TWO NOTES THERE
        //            setPositionBasedOnDistance();
        //
        //          } else {
        //            // NO CURVEDIR SPECIFIED
        //
        //            if (f_note.layerDir || l_note.layerDir) {
        //              // NO FIXED PLACE - MULTI LAYER
        //              slurOptions.invert = true;
        //
        //              if (f_note.vexNote && l_note.vexNote && f_note.vexNote.hasStem() && l_note.vexNote.hasStem()) {
        //                slurOptions.position = VF.Curve.Position.NEAR_TOP;
        //
        //                if (f_note.vexNote.getStemDirection() !== l_note.vexNote.getStemDirection()) {
        //                  slurOptions.position_end = VF.Curve.Position.NEAR_HEAD;
        //                }
        //
        //              }
        //            } else {
        //              if (f_note.vexNote && l_note.vexNote) {
        //                setPositionBasedOnDistance();
        //              }
        //            }
        //          }
        //
        //        }

        //        console.log('curve dir: ' + curveDir + ', ' + 'layer dir: ' + params.layerDir + ', ');

        // finally, in all cases, handle system breaks and create slur objects
        if (f_note.system !== undefined && l_note.system !== undefined && f_note.system !== l_note.system) {
          me.createSingleSlur(f_note, {}, {
            y_shift_start : slurOptions.y_shift_start,
            y_shift_end : slurOptions.y_shift_end,
            invert : ((curveDir === ABOVE && firstStemDir === ABOVE) || (curveDir === BELOW && firstStemDir === BELOW)),
            position : slurOptions.position,
            position_end : slurOptions.position
          });

          slurOptions.position = slurOptions.position_end;
          slurOptions.invert =
          ((curveDir === ABOVE && lastStemDir === ABOVE) || (curveDir === BELOW && lastStemDir === BELOW));
          me.createSingleSlur({}, l_note, slurOptions);
        } else {
          me.createSingleSlur(f_note, l_note, slurOptions);
        }

      }
      return this;
    },

    createSingleSlur : function (f_note, l_note, slurOptions) {
      this.allVexObjects.push(new VF.Curve(f_note.vexNote, l_note.vexNote, slurOptions));
    },

    bezierStringToCps : function (str) {
      var cps = [], regex, matched;
      regex = /(\-?[\d|\.]+)\s+(\-?[\d|\.]+)/g;
      while (matched = regex.exec(str)) {
        cps.push({
          x : +matched[1],
          y : +matched[2]
        });
      }
      if (!cps[1]) {
        Logger.info('Incomplete attribute', 'Expected four control points in slur/@bezier, but only found two. Providing cps 3 & 4 on basis on cps 1 & 2.');
        cps[1] = {x : -cps[0].x, y : cps[0].y};
      }
      return cps;
    }
  });
/*
 * MEItoVexFlow, EventPointerCollection class
 * (based on meitovexflow.js)

 * Author: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class EventPointerCollection
   * @private
   *
   * @constructor
   */
  var EventPointerCollection = function (systemInfo, font) {
    this.init(systemInfo, font);
  };

  EventPointerCollection.prototype = {

    BOTTOM : VF.Annotation.VerticalJustify.BOTTOM,

    /**
     * initializes the EventPointerCollection
     */
    init : function (systemInfo, font) {
      /**
       * @property
       */
      this.allVexObjects = [];
      /**
       * @property
       */
      this.allModels = [];
      /**
       * @property
       */
      this.systemInfo = systemInfo;
      /**
       * @property
       */
      this.font = font;
    },

    /**
     * adds a new model to {@link #allModels}
     * @param {Object} obj the object to add
     */
    addModel : function (obj) {
      this.allModels.push(obj);
    },

    /**
     * gets all models
     * @return {Object[]} all models in {@link #allModels}
     */
    getModels : function () {
      return this.allModels;
    },

    createInfos : function (elements, measureElement) {
      var me = this, i, j, element, atts, startid, tstamp;

      var link_staveInfo = function (lnkelem) {
        return {
          stave_n : lnkelem.getAttribute('staff') || '1',
          layer_n : lnkelem.getAttribute('layer') || '1'
        };
      };

      // convert tstamp into startid in current measure
      var local_tstamp2id = function (tstamp, lnkelem, measureElement) {
        var stffinf = link_staveInfo(lnkelem);
        var stave = measureElement.querySelector('staff[n="' + stffinf.stave_n + '"]');
        if (!stave) {
          throw new RuntimeError('Could not find staff @n="' + stffinf.stave_n + '" in ' +
                                 Util.serializeElement(measureElement) + ' while processing ' + Util.serializeElement(lnkelem));
        }
        var layer = stave.querySelector('layer[n="' + stffinf.layer_n + '"]');
        if (!layer) {
          var layer_candid = stave.getElementsByTagName('layer')[0];
          if (layer_candid && !layer_candid.hasAttribute('n')) {
            layer = layer_candid;
          }
          if (!layer) {
            throw new RuntimeError('Could not find layer @n="' + stffinf.layer_n + '" in ' +
                                   Util.serializeElement(measureElement) + ' while processing ' + Util.serializeElement(lnkelem));
          }
        }
        var staveInfo = me.systemInfo.getStaveInfo(stffinf.stave_n);
        if (!staveInfo) {
          throw new RuntimeError('Cannot determine staff definition.');
        }
        var meter = staveInfo.getTimeSpec();
        if (!meter.count || !meter.unit) {
          throw new RuntimeError('Cannot determine meter; missing or incorrect @meter.count or @meter.unit.');
        }
        return MeiLib.tstamp2id(tstamp, layer, meter);
      };

      for (i = 0, j = elements.length; i < j; i++) {
        element = elements[i];

        atts = Util.attsToObj(element);

        startid = atts.startid;
        if (startid) {
          //BC
          startid = startid;//.substring(1);
        } else {
          tstamp = atts.tstamp;
          if (tstamp) {
            startid = local_tstamp2id(tstamp, element, measureElement);
          } else {
            Logger.warn('@startid or @tstamp expected', Util.serializeElement(element) +
                                                        ' could not be processed because neither @startid nor @tstamp are specified.');
            return;
          }
        }
        me.allModels.push({
          element : element,
          atts : atts,
          startid : startid
        });
      }
    },


    createVexFromInfos : function (notes_by_id) {
      var me = this, i, model, note;
      i = me.allModels.length;
      while (i--) {
        model = me.allModels[i];
        note = notes_by_id[model.startid];
        if (note) {
          me.addToNote(model, note);
        } else {
          if (model.startid) {
            Logger.warn('Unknown reference', Util.serializeElement(model.element) +
                                             ' could not be processed because the reference "' + model.startid +
                                             '" could not be resolved.');
          } else {
            Logger.warn('Unknown reference', Util.serializeElement(model.element) +
                                             ' could not be processed because it could not be assigned to an element.');
          }
        }
      }
    },

    addToNote : function () {
      throw new RuntimeError('You have to provide an addToNote() method when inheriting MEI2VF.EventPointerCollection.');
    }
  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  /**
   * @class Arpeggios
   * @extend EventPointerCollection
   * @private
   *
   * @constructor
   */
  var Arpeggios = function (systemInfo) {
    this.init(systemInfo);
  };

  Vex.Inherit(Arpeggios, EventPointerCollection, {

    init : function (systemInfo, font) {
      Arpeggios.superclass.init.call(this, systemInfo, font);
    },

    createInfos : function (elements, measureElement) {
      var me = this, i, j, element, atts, startid, tstamp;

      var link_staveInfo = function (lnkelem) {
        return {
          stave_n : lnkelem.getAttribute('staff') || '1',
          layer_n : lnkelem.getAttribute('layer') || '1'
        };
      };

      // convert tstamp into startid in current measure
      var local_tstamp2id = function (tstamp, lnkelem, measureElement) {
        var stffinf = link_staveInfo(lnkelem);
        var stave = measureElement.querySelector('staff[n="' + stffinf.stave_n + '"]');
        if (!stave) {
          throw new RuntimeError('Could not find staff @n="' + stffinf.stave_n + '" in ' +
                                 Util.serializeElement(measureElement) + ' while processing ' + Util.serializeElement(lnkelem));
        }
        var layer = stave.querySelector('layer[n="' + stffinf.layer_n + '"]');
        if (!layer) {
          var layer_candid = stave.getElementsByTagName('layer')[0];
          if (layer_candid && !layer_candid.hasAttribute('n')) {
            layer = layer_candid;
          }
          if (!layer) {
            throw new RuntimeError('Could not find layer @n="' + stffinf.layer_n + '" in ' +
                                   Util.serializeElement(measureElement) + ' while processing ' + Util.serializeElement(lnkelem));
          }
        }
        var staveInfo = me.systemInfo.getStaveInfo(stffinf.stave_n);
        if (!staveInfo) {
          throw new RuntimeError('Cannot determine staff definition.');
        }
        var meter = staveInfo.getTimeSpec();
        if (!meter.count || !meter.unit) {
          throw new RuntimeError('Cannot determine meter; missing or incorrect @meter.count or @meter.unit.');
        }
        return MeiLib.tstamp2id(tstamp, layer, meter);
      };

      for (i = 0, j = elements.length; i < j; i++) {
        element = elements[i];

        atts = Util.attsToObj(element);

        var pList;
        if (atts.plist) {
          pList = Util.pListToArray(atts.plist);
        }

        // TODO handle arpeggio over multiple notes / chords!

        // for now, only look for the first id in the plist

        if (pList && pList[0]) {
          startid = pList[0].substring(1);
        } else {
          tstamp = atts.tstamp;
          if (tstamp) {
            startid = local_tstamp2id(tstamp, element, measureElement);
          } else {
            Logger.warn('@startid or @tstamp expected', Util.serializeElement(element) +
                                                        ' could not be processed because neither @startid nor @tstamp are specified.');
            return;
          }
        }
        me.allModels.push({
          element : element,
          atts : atts,
          startid : startid
        });
      }
    },


    addToNote : function(model, note) {
      note.vexNote.addStroke(0, new VF.Stroke(0));
    }

  });
/*
 * MEItoVexFlow, Directives class
 * (based on meitovexflow.js)
 * Author of reworkings: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class Directives
   * @extend EventPointerCollection
   * @private
   *
   * @constructor
   */
  var Directives = function (systemInfo, font) {
    this.init(systemInfo, font);
  };

  Vex.Inherit(Directives, EventPointerCollection, {

    init : function (systemInfo, font) {
      Directives.superclass.init.call(this, systemInfo, font);
    },

    addToNote : function (model, note) {
      var me = this, annot, rend, font, rendAtts;

      font = {
        family: me.font.family,
        size: me.font.size,
        weight: ''
      };

      rend = model.element.getElementsByTagName('rend')[0];
      if (rend) {
        rendAtts = Util.attsToObj(rend);
        if (rendAtts.fontfamily) font.family = rendAtts.fontfamily;
        if (rendAtts.fontweight) font.weight += rendAtts.fontweight + ' ';
        if (rendAtts.fontstyle) font.weight += rendAtts.fontstyle;
        if (rendAtts.fontsize) font.size = +rendAtts.fontsize * 1.5;
      }

      annot = (new VF.Annotation(Util.getNormalizedText(model.element).trim())).setFont(font.family, font.size, font.weight).setMeiElement(model.element);

      // TEMPORARY: set width of modifier to zero so voices with modifiers
      // don't get too much width; remove when the width calculation in
      // VexFlow does distinguish between different y values when
      // calculating the width of tickables
      annot.setWidth(0);
      annot.setJustification(1); // left by default
      if (model.atts.place === 'below') {
        note.vexNote.addAnnotation(0, annot.setVerticalJustification(me.BOTTOM));
      } else {
        note.vexNote.addAnnotation(0, annot);
      }
    }

  });
/*
 * MEItoVexFlow, Dynamics class
 * (based on meitovexflow.js)
 * Author of reworkings: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class Dynamics
   * @extend EventPointerCollection
   * @private
   *
   * @constructor
   */
  var Dynamics = function (systemInfo, font) {
    this.init(systemInfo, font);
  };

  Vex.Inherit(Dynamics, EventPointerCollection, {

    init : function (systemInfo, font) {
      Dynamics.superclass.init.call(this, systemInfo, font);
    },

    addToNote : function(model, note) {
      var me = this, annot =
      (new VF.Annotation(Util.getText(model.element).trim())).setFont(me.font.family, me.font.size, me.font.weight).setMeiElement(model.element);

      // TEMPORARY: set width of modifier to zero so voices with modifiers
      // don't get too much width; remove when the width calculation in
      // VexFlow does distinguish between different y values when
      // calculating the width of tickables
      annot.setWidth(0);
      if (model.atts.place === 'above') {
        note.vexNote.addAnnotation(0, annot);
      } else {
        note.vexNote.addAnnotation(0, annot.setVerticalJustification(me.BOTTOM));
      }
    }

  });
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  /**
   * @class Fermatas
   * @extend EventPointerCollection
   * @private
   *
   * @constructor
   */
  var Fermatas = function (systemInfo, font) {
    this.init(systemInfo, font);
  };

  Vex.Inherit(Fermatas, EventPointerCollection, {

    init : function (systemInfo, font) {
      Fermatas.superclass.init.call(this, systemInfo, font);
    },

    addToNote : function (model, note) {
      EventUtil.addFermata(note.vexNote, model.element, model.atts.place);
    }

  });
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  /**
   * @class Ornaments
   * @extend PointerCollection
   * @private
   *
   * @constructor
   */
  var Ornaments = function (systemInfo, font) {
    this.init(systemInfo, font);
  };

  Vex.Inherit(Ornaments, EventPointerCollection, {

    init : function (systemInfo, font) {
      Ornaments.superclass.init.call(this, systemInfo, font);
    },

    /**
     * adds an ornament to a note-like object
     * @method addOrnamentToNote
     * @param {Object} model
     * @param {Object} note
     */
    addToNote : function (model, note) {
      var atts = model.atts;
      // TODO support @tstamp2 etc -> make Link instead of Pointer

      var ornamentMap = {
        'trill' : 'tr', 'mordent' : 'mordent', 'turn' : 'turn'
      };

      var name = ornamentMap[model.element.localName];

      var form;
      if (name === 'mordent') {
        form = (atts.form === 'inv') ? '' : '_inverted';
      } else {
        form = (atts.form === 'inv') ? '_inverted' : '';
      }

      var vexOrnament = new VF.Ornament(name + form);

      vexOrnament.setMeiElement(model.element);

      // not yet implemented in vexFlow
      //      var place = atts.place;
      //      if (place) {
      //        vexOrnament.position = Tables.positions[place];
      //      }

      //      notesBar1[0].addModifier(0, new Vex.Flow.Ornament("mordent"));
      //      notesBar1[1].addModifier(0, new Vex.Flow.Ornament("mordent_inverted"));
      //      notesBar1[2].addModifier(0, new Vex.Flow.Ornament("turn"));
      //      notesBar1[3].addModifier(0, new Vex.Flow.Ornament("turn_inverted"));
      //      notesBar1[4].addModifier(0, new Vex.Flow.Ornament("tr"));
      //      notesBar1[5].addModifier(0, new Vex.Flow.Ornament("upprall"));
      //      notesBar1[6].addModifier(0, new Vex.Flow.Ornament("downprall"));
      //      notesBar1[7].addModifier(0, new Vex.Flow.Ornament("prallup"));
      //      notesBar1[8].addModifier(0, new Vex.Flow.Ornament("pralldown"));
      //      notesBar1[9].addModifier(0, new Vex.Flow.Ornament("upmordent"));
      //      notesBar1[10].addModifier(0, new Vex.Flow.Ornament("downmordent"));
      //      notesBar1[11].addModifier(0, new Vex.Flow.Ornament("lineprall"));
      //      notesBar1[12].addModifier(0, new Vex.Flow.Ornament("prallprall"));

      if (atts.accidupper) {
        vexOrnament.setUpperAccidental(Tables.accidentals[atts.accidupper]);
      }
      if (atts.accidlower) {
        vexOrnament.setLowerAccidental(Tables.accidentals[atts.accidlower]);
      }
      note.vexNote.addModifier(0, vexOrnament);
    }
  });
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  var SpanCollection = function() {};

  SpanCollection.prototype = {

    init: function () {
      var me = this;
      me.spanElements = [];
      me.vexObjects = [];
    },

    addSpanElements: function (elements) {
      this.spanElements.push(elements);
    },

    addVexObject : function (obj) {
      this.vexObjects.push(obj);
    },

    resolveSpans : function (elements, fragmentPostProcessor, notes_by_id) {
      var me = this, i, j, element, pList, pListArray, startIdAtt, endIdAtt;

      for (i = 0, j = elements.length; i < j; i++) {
        element = elements[i];
        pList = element.getAttribute('plist');
        pListArray = Util.pListToArray(pList);

        startIdAtt = element.getAttribute('startid');
        endIdAtt = element.getAttribute('endid');
        if (startIdAtt !== null || endIdAtt !== null) {
          // insert startid and endid to the plist if they're not already there
          if (pListArray[0] !== startIdAtt) {
            pListArray.unshift(startIdAtt);
          }
          if (pListArray[pListArray.length - 1] !== endIdAtt) {
            pListArray.push(endIdAtt);
          }
          var voices = [];
          var firstMeasure;
          var noteObjects = pListArray.map(function (item, index) {
            var obj = notes_by_id[item.substring(1)];
            if (!obj) {
              throw new RuntimeError('Reference "' + item + '" given in ' + Util.serializeElement(element) +
                                     ' not found.')
            }
            var voice = obj.vexNote.voice;
            if (index === 0) {
              firstMeasure = $(obj.meiNote).closest('measure').get(0);
            }
            var voiceIndex = voices.indexOf(voice);
            if (voiceIndex === -1) {
              // voice index remains -1 if the note is not in the start measure; it will not get
              // included then when adding spaces
              if (!firstMeasure || $(obj.meiNote).closest('measure').get(0) === firstMeasure) {
                //noinspection JSReferencingMutableVariableFromClosure
                voiceIndex = voices.push(voice) - 1;
              }
            }
            return {
              obj : obj, voiceIndex : voiceIndex, vexNote : obj.vexNote
            };
          });

          var newSpace;

          var createSpaceFrom = function (vexNote, stave) {
            var gn = new VF.GhostNote(vexNote.getDuration());

            // TODO handle dots
            gn.setStave(stave);
            return gn;
          };

          var notes = noteObjects.map(function (item) {
            return item.vexNote;
          });

          var newVoiceSegment;
          var indicesInVoice;

          if (voices.length > 1) {
            // create spaces in voices

            for (var m = 0, n = voices.length; m < n; m++) {
              newVoiceSegment = [];
              indicesInVoice = [];
              for (var o = 0, p = noteObjects.length; o < p; o++) {
                if (noteObjects[o].voiceIndex === m) {
                  newVoiceSegment[o] = noteObjects[o].vexNote;
                  indicesInVoice.push(voices[m].tickables.indexOf(noteObjects[o].vexNote));
                } else if (noteObjects[o].voiceIndex !== -1) {

                  // TODO handle this later for each measure!!!
                  newSpace = createSpaceFrom(noteObjects[o].vexNote, voices[m].tickables[0].stave);
                  newVoiceSegment[o] = newSpace;
                }
              }

              var t = voices[m].tickables;
              if (m !== 0 && typeof fragmentPostProcessor === 'function') {
                fragmentPostProcessor(element, newVoiceSegment);
              }
              voices[m].tickables =
              t.slice(0, indicesInVoice[0]).concat(newVoiceSegment).concat(t.slice(indicesInVoice[indicesInVoice.length -
                                                                                                  1] + 1));
            }
          }

          me.createVexObject(notes, voices, element);

        } else {
          Logger.warn('Missing attributes', 'Could not process ' + Util.serializeElement(element) +
                                            ', because @startid or @endid is missing.')
        }
      }
    },

    createVexObject : function () {
      throw new RuntimeError('createVexObject() method not implemented.');
    },

    postFormat : function () {
      var i, j, items = this.vexObjects;
      for (i = 0, j = items.length; i < j; i++) {
        items[i].postFormat();
      }
    },

    setContext : function(ctx) {
      this.ctx = ctx;
      return this;
    },

    draw : function () {
      var me = this, i, j, items = me.vexObjects, ctx = me.ctx;
      for (i = 0, j = items.length; i < j; i++) {
        items[i].setContext(ctx).draw();
      }
    }


  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  /**
   * @class BeamCollection
   * @extend SpanCollection
   * @private
   *
   * @constructor
   */
  var BeamCollection = function () {
    this.init();
  };

  Vex.Inherit(BeamCollection, SpanCollection, {

    init : function () {
      BeamCollection.superclass.init.call(this);
    },

    resolveSpanElements : function (notes_by_id) {
      var me = this;
      me.resolveSpans(me.spanElements, null, notes_by_id);
    },

    createVexObject : function (notes) {
      this.vexObjects.push(new VF.Beam(notes, false));
    }

  });
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  /**
   * @class TupletCollection
   * @extend SpanCollection
   * @private
   *
   * @constructor
   */
  var TupletCollection = function () {
    this.init();
  };

  Vex.Inherit(TupletCollection, SpanCollection, {

    init : function () {
      TupletCollection.superclass.init.call(this);
    },

    resolveSpanElements : function (notes_by_id) {
      var me = this;

      var fragmentPostProcessor = function (element, slice) {
        new VF.Tuplet(slice, {
          num_notes : parseInt(element.getAttribute('num'), 10) || 3,
          beats_occupied : parseInt(element.getAttribute('numbase'), 10) || 2
        })
      };

      me.resolveSpans(me.spanElements, fragmentPostProcessor, notes_by_id);
    },

    createVexObject : function (notes, voices, element) {
      var me=this, tickables, tuplet, voice, i, j;

      tuplet = new VF.Tuplet(notes, {
        num_notes : parseInt(element.getAttribute('num'), 10) || 3,
        beats_occupied : parseInt(element.getAttribute('numbase'), 10) || 2
      });

      if (element.getAttribute('num.format') === 'ratio') {
        tuplet.setRatioed(true);
      }

      tuplet.setBracketed(element.getAttribute('bracket.visible') === 'true');

      var bracketPlace = element.getAttribute('bracket.place');
      if (bracketPlace) {
        tuplet.setTupletLocation((bracketPlace === 'above') ? 1 : -1);
      }

      me.vexObjects.push(tuplet);

      // TODO make this more efficient
      for (i = 0, j = voices.length; i < j; i++) {
        voice = voices[i];
        tickables = voice.tickables;
        voice.ticksUsed = new Vex.Flow.Fraction(0, 1);
        voice.tickables = [];
        voice.addTickables(tickables);
      }

    }

  });
/*
 * MEItoVexFlow, Hyphenation class
 *
 * Author: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class MEI2VF.Hyphenation
   * @private
   * @param font
   * @param maxHyphenDistance
   * @constructor
   */
  var Hyphenation = function (font, maxHyphenDistance) {
    var me = this;
    me.allSyllables = [];
    me.font = font;
    me.maxHyphenDistance = maxHyphenDistance;
  };

  Hyphenation.prototype = {

    /**
     * @const {null} WORD_SEPARATOR the object indicating the transition between two separate words
     */
    WORD_SEPARATOR : null,

    addSyllable : function (annot, wordpos) {
      var me = this;
      if (wordpos === 'i') me.allSyllables.push(me.WORD_SEPARATOR);
      me.allSyllables.push(annot);
      if (wordpos === 't') me.allSyllables.push(me.WORD_SEPARATOR);
    },

    setContext : function (ctx) {
      this.ctx = ctx;
      return this;
    },

    draw : function (leftX, rightX) {
      var me = this, i, first, second, hyphenWidth;

      me.ctx.setFont(me.font.family, me.font.size, me.font.weight);

      hyphenWidth = me.ctx.measureText('-').width;

      i = me.allSyllables.length + 1;
      while (i--) {
        first = me.allSyllables[i - 1];
        second = me.allSyllables[i];

        if (first !== me.WORD_SEPARATOR && second !== me.WORD_SEPARATOR) {
          var opts = {
            hyphen_width : hyphenWidth,
            max_hyphen_distance : me.maxHyphenDistance
          };
          if (first === undefined) {
            // we're at the start of a system
            opts.first_annot = { x : leftX };
          } else {
            opts.first_annot = first;
          }
          if (second === undefined) {
            // we're at the end of a system
            opts.last_annot = { x : rightX };
          } else {
            opts.last_annot = second;
          }
          if (opts.first_annot.y || opts.last_annot.y) {
            var h = new VF.Hyphen(opts);
            h.setContext(me.ctx).renderHyphen();
          }
        }
      }
    }
  };
/*
 * MEItoVexFlow, Verses class
 *
 * Author: Zoltan Komives
 * Contributor: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class MEI2VF.Verses
   * @private
   *
   * @constructor
   * @param {Object} config
   */
  var Verses = function (config) {
    var me = this;
    me.systemVerses = {};
    me.lowestYs = {};
    me.font = config.font;
    me.maxHyphenDistance = config.maxHyphenDistance;
  };

  Verses.prototype = {

    /**
     * @public
     * @param annot
     * @param element
     * @param stave_n
     * @returns {Verses}
     */
    addSyllable : function (annot, element, stave_n) {
      var me = this, verse_n;

      var wordpos = element.getAttribute('wordpos');

      var parentNode = element.parentNode;
      if (parentNode.localName === 'verse' && parentNode.hasAttribute('n')) {
        verse_n = parentNode.getAttribute('n');
      } else {
        verse_n = '1';
      }

      if (!me.systemVerses[stave_n]) {
        me.systemVerses[stave_n] = {};
      }

      if (!me.systemVerses[stave_n][verse_n]) {
        me.systemVerses[stave_n][verse_n] = {
          syllables: [],
          hyphenation : me.newHyphenation()
        };
      }

      me.systemVerses[stave_n][verse_n].syllables.push(annot);

      if (wordpos) {
        me.systemVerses[stave_n][verse_n].hyphenation.addSyllable(annot, wordpos);
      }
      return me;
    },

    /**
     * @public
     */
    getLowestYs : function () {
      return this.lowestYs;
    },

    /**
     * @public
     */
    getLowestY : function (stave_n) {
      return this.lowestYs[stave_n];
    },

    /**
     * @private
     */
    newHyphenation : function () {
      return new Hyphenation(this.font, this.maxHyphenDistance);
    },

    /**
     * @public
     * @returns {Verses}
     */
    format : function () {
      var me = this, stave_n, verse_n, text_line, verse, i, j, lowestY, padding, lowestTextLine;
      var notesInContext;

      padding = 20;

      me.font.size=15;

      var spacing_between_lines = 10;
      var height_in_lines = me.font.size / spacing_between_lines * 1.5;

      for (stave_n in me.systemVerses) {
        text_line = 0;
        lowestTextLine = 0;
        lowestY = -20;

        for (verse_n in me.systemVerses[stave_n]) {
          verse = me.systemVerses[stave_n][verse_n].syllables;
          lowestY += padding;
          // first pass: get lowest y
          for (i = 0, j = verse.length; i < j; i++) {
            verse[i].setTextLine(text_line);

            notesInContext = verse[i].getModifierContext().modifiers.stavenotes;

            if (notesInContext.length > 1) {
              verse[i].setNote(notesInContext[0]);
            }

            // TODO compare lowest Ys


            lowestY = Math.max(lowestY, verse[i].preProcess());

//            lowestTextLine = Math.max(lowestTextLine, verse[i].text_line);
          }
          // second pass: set lowest y
          for (i = 0; i < j; i++) {
            verse[i].setY(lowestY);
//            verse[i].setTextLine(lowestTextLine);
          }
          lowestTextLine += height_in_lines;
        }
        me.lowestYs[stave_n] = lowestY;

      }
      return me;
    },

    /**
     * @public
     * @param ctx
     * @param leftX
     * @param rightX
     * @returns {Verses}
     */
    drawHyphens : function (ctx, leftX, rightX) {
      var me = this, stave_n, verse_n;
      for (stave_n in me.systemVerses) {
        for (verse_n in me.systemVerses[stave_n]) {
          me.systemVerses[stave_n][verse_n].hyphenation.setContext(ctx).draw(leftX, rightX);
        }
      }
      return me;
    }

  };
/*
 * MEItoVexFlow, Syllable class
 * a modified version on VexFlow's annotation.js
 *
 * Authors: Zoltan Komives, Alexander Erhard
 */

// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.



  var Syllable = function (text, element, font) {
    this.init(text);
    this.setFont(font.family, font.size, font.weight);
    this.setMeiElement(element);
    this.setLineSpacing(font.spacing);
  };

  Syllable.CATEGORY = "annotations";

  // To enable logging for this class. Set `Vex.Flow.Syllable.DEBUG` to `true`.
  function L() {
    if (Syllable.DEBUG) Vex.L("Vex.Flow.Syllable", arguments);
  }

  // START ADDITION
  Syllable.DEFAULT_FONT_SIZE = 10;
  // END ADDITION

  // Text annotations can be positioned and justified relative to the note.
  Syllable.Justify = {
    LEFT : 1,
    CENTER : 2,
    RIGHT : 3,
    CENTER_STEM : 4
  };

  Syllable.VerticalJustify = {
    TOP : 1,
    BOTTOM : 3
  };

  // Arrange annotations within a `ModifierContext`
  Syllable.format = function (annotations, state) {
    if (!annotations || annotations.length === 0) return false;

    var text_line = state.text_line;
    var max_width = 0;

    // Format Syllables
    var width;
    for (var i = 0; i < annotations.length; ++i) {
      var annotation = annotations[i];
      annotation.setTextLine(text_line);
      width = annotation.getWidth() > max_width ? annotation.getWidth() : max_width;
      text_line++;
    }

    state.left_shift += width / 2;
    state.right_shift += width / 2;
    return true;
  };

  // ## Prototype Methods
  //
  // Syllables inherit from `Modifier` and are positioned correctly when
  // in a `ModifierContext`.
  var Modifier = VF.Modifier;

  Vex.Inherit(Syllable, Modifier, {
    // Create a new `Syllable` with the string `text`.
    init : function (text) {
      Syllable.superclass.init.call(this);

      this.note = null;
      this.index = null;
      this.text_line = 0;
      this.text = text;
      this.justification = Syllable.Justify.CENTER;
      // START MODIFICATION
      this.vert_justification = Syllable.VerticalJustify.BOTTOM;
      // END MODIFICATION
      this.font = {
        family : "Arial",
        // START MODIFICATION
        size : Syllable.DEFAULT_FONT_SIZE,
        // END MODIFICATION
        weight : ""
      };

      // START ADDITION
      // Line spacing, relative to font size
      this.line_spacing = 1.1;
      // END ADDITiON

      // The default width is calculated from the text.
      this.setWidth(VF.textWidth(text));
    },

    // START ADDITION
     setMeiElement : function (element) {
      this.meiElement = element;
      return this;
    },

    getMeiElement : function () {
      return this.meiElement;
    },

    setLineSpacing : function (spacing) {
      this.line_spacing = spacing;
      return this;
    },
    // END ADDITiON

    // Set the vertical position of the text relative to the stave.
    setTextLine : function (line) {
      this.text_line = line;
      return this;
    },

    // Set font family, size, and weight. E.g., `Arial`, `10pt`, `Bold`.
    setFont : function (family, size, weight) {
      this.font = { family : family, size : size, weight : weight };
      return this;
    },

    // Set vertical position of text (above or below stave). `just` must be
    // a value in `Syllable.VerticalJustify`.
    setVerticalJustification : function (just) {
      this.vert_justification = just;
      return this;
    },

    // Get and set horizontal justification. `justification` is a value in
    // `Syllable.Justify`.
    getJustification : function () {
      return this.justification;
    },
    setJustification : function (justification) {
      this.justification = justification;
      return this;
    },

    preProcess : function () {

      var PADDING = 5;

      var y;

      var stem_ext, spacing;
      var has_stem = this.note.hasStem();
      var stave = this.note.getStave();

      // The position of the text varies based on whether or not the note
      // has a stem.
      if (has_stem) {
        stem_ext = this.note.getStem().getExtents();
        spacing = stave.getSpacingBetweenLines();
      }

      // START ADDITION
      var font_scale = this.font.size / Syllable.DEFAULT_FONT_SIZE * this.line_spacing;
      // END ADDITION

      if (this.vert_justification == Syllable.VerticalJustify.BOTTOM) {
        y = stave.getYForBottomText(this.text_line);
        if (has_stem) {
          var stem_base = (this.note.getStemDirection() === 1 ? stem_ext.baseY + 2 * PADDING : stem_ext.topY + PADDING);

          // START MODIFICATION
          y = Math.max(y, stem_base + ( spacing * (this.text_line + 1) * font_scale + ( spacing * (this.text_line) ) ));
          // END MODIFICATION
        }

        // TODO refactor top text, too
      } else if (this.vert_justification == Syllable.VerticalJustify.TOP) {
        y = Math.min(stave.getYForTopText(this.text_line), this.note.getYs()[0] - 10);
        if (has_stem) {
          y = Math.min(y, (stem_ext.topY - 5) - (spacing * this.text_line));
        }
      }

      this.y = y;
      return y;
    },

    setY : function (y) {
      this.y = y;
    },

    // Render text beside the note.
    draw : function () {
      if (!this.context) throw new Vex.RERR("NoContext", "Can't draw text annotation without a context.");
      if (!this.note) throw new Vex.RERR("NoNoteForSyllable", "Can't draw text annotation without an attached note.");

      var start = this.note.getModifierStartXY(Modifier.Position.ABOVE, this.index);

      // We're changing context parameters. Save current state.
      this.context.save();
      this.context.setFont(this.font.family, this.font.size, this.font.weight);
      var text_width = this.context.measureText(this.text).width;

      // Estimate text height to be the same as the width of an 'm'.
      //
      // This is a hack to work around the inability to measure text height
      // in HTML5 Canvas (and SVG).
      var text_height = this.context.measureText("m").width;
      var x, y;

      if (this.justification == Syllable.Justify.LEFT) {
        x = start.x;
      } else if (this.justification == Syllable.Justify.RIGHT) {
        x = start.x - text_width;
      } else if (this.justification == Syllable.Justify.CENTER) {
        x = start.x - text_width / 2;
      } else /* CENTER_STEM */ {
        x = this.note.getStemX() - text_width / 2;
      }

      // START ADDITION
      this.x = x;

      y = this.y;

      this.text_height = text_height;
      this.text_width = text_width;
      // END ADDITION

      L("Rendering annotation: ", this.text, x, y);
      this.context.fillText(this.text, x, y);
      this.context.restore();
    }
  });
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


  /**
   * Creates a new Stave object at the specified y coordinate. This
   * method sets fixed x coordinates, which will later be substituted in
   * {@link MEI2VF.System#format} - the Vex.Flow.Stave
   * objects must be initialized with some x measurements, but the real
   * values depend on values only available after modifiers, voices etc
   * have been added.
   *
   * @constructor
   * @param {Object} cfg
   */
  var Stave = function (cfg) {
    var me = this, leftBarline, rightBarline;

    me.init(0, cfg.y, 1000, {
      vertical_bar_width : 20, // 10 // Width around vertical bar end-marker
      top_text_position : 1.5, // 1 // in stave lines
      fill_style : me.lineColor
    });
    me.options.bottom_text_position = 6.5;

    me.setSystem(cfg.system);

    if (cfg.barlineInfo) {
      leftBarline = cfg.barlineInfo.leftBarline;
      rightBarline = cfg.barlineInfo.rightBarline;
    }

    if (leftBarline) {
      me.setBegBarType(me.barlines[leftBarline]);
      me.leftBarlineElement = cfg.barlineInfo.leftBarlineElement;
    } else {
      me.setBegBarType(me.barlines['invis']);
    }
    if (rightBarline) {
      me.setEndBarType(me.barlines[rightBarline]);
    }

  };

  Vex.Inherit(Stave, VF.Stave, {

    lineColor : '#999999',

    barlines : {
      'single' : VF.Barline.type.SINGLE,
      'dbl' : VF.Barline.type.DOUBLE,
      'end' : VF.Barline.type.END,
      'rptstart' : VF.Barline.type.REPEAT_BEGIN,
      'rptend' : VF.Barline.type.REPEAT_END,
      'rptboth' : VF.Barline.type.REPEAT_BOTH,
      'invis' : VF.Barline.type.NONE
    },

    addVoltaFromInfo : function (voltaInfo) {
      var begin = voltaInfo.hasOwnProperty('start');
      var end = voltaInfo.hasOwnProperty('end');
      if (begin) {
        this.setVoltaType((end) ? VF.Volta.type.BEGIN_END : VF.Volta.type.BEGIN, voltaInfo.start, 30);
      } else {
        this.setVoltaType((end) ? VF.Volta.type.END : VF.Volta.type.MID, "", 30);
      }
      // TODO [think through in which cases we actually need type.END]
      // 1) at the end of a composition
      // 2) if the current volta is followed by another volta (type.MID might be sufficient when
      // both volte are in the same system, but in cases where the first volta is at the end of
      // a system, it erroneously remains 'open'
    },

    // FIXME check if deviation of clef.shift between clef and end clef is OK
    addClefFromInfo : function (clef) {
      var me = this;
      me.addClef(clef.type, clef.size, clef.shift === -1 ? '8vb' : undefined);

      me.meiClefElement = clef.meiElement;
    },

    addEndClefFromInfo : function (clef) {
      var me = this;
      me.addEndClef(clef.type, 'small', clef.shift);

      me.meiEndClefElement = clef.meiElement;
    },

    addKeySpecFromInfo : function (keySpec, padding) {
      var me = this;
      me.addModifier(new VF.KeySignature(keySpec.key, padding));

      me.meiKeySpecElement = keySpec.meiElement;
    },

    addTimeSpecFromInfo : function (timeSpec, padding) {
      var me = this, symbol, count, unit, vexTimeSig;
      symbol = timeSpec.sym;
      if (symbol) {
        vexTimeSig = (symbol === 'cut') ? 'C|' : 'C';
      } else {
        count = timeSpec.count;
        unit = timeSpec.unit;
        vexTimeSig = (count && unit) ? count + '/' + unit : undefined;
      }
      me.addTimeSignature(vexTimeSig, padding);

      me.meiTimeSpecElement = timeSpec.meiElement;
    },

    hasTimeSig : function () {
      return typeof this.meiTimeSpecElement !== 'undefined';
    },

    setSystem : function (system) {
      this.system = system;
    },

    setSlurStartX : function (x) {
      this.slurStartX = x;
    },

    getSlurStartX : function () {
      return this.system.getSlurStartX();
    },

    setSlurEndX : function (x) {
      this.slurEndX = x;
    },

    getSlurEndX : function () {
      return this.system.getSlurEndX();
    }

  });
/*
 * StaveConnector.js Author: Zoltan Komives (zolaemil@gmail.com) Created:
 * 24.07.2013
 *
 * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/*
 * Contributor: Alexander Erhard
 */


  /**
   * @class MEI2VF.Connectors
   * Handles stave connectors
   * @private
   *
   * @constructor
   * @param {Object} config the config object
   */
  var StaveConnectors = function (config) {
    var me = this;
    me.allVexConnectors = [];
    if (config) {
      me.init(config);
    }
  };

  StaveConnectors.prototype = {

    vexTypes : {
      'line' : VF.StaveConnector.type.SINGLE_LEFT,
      'brace' : VF.StaveConnector.type.BRACE,
      'bracket' : VF.StaveConnector.type.BRACKET,
      'none' : null,
      'singleright' : VF.StaveConnector.type.SINGLE_RIGHT
    },

    vexTypesBarlineRight : {
      'single' : VF.StaveConnector.type.SINGLE_RIGHT,
      'dbl' : VF.StaveConnector.type.THIN_DOUBLE,
      'end' : VF.StaveConnector.type.BOLD_DOUBLE_RIGHT,
      'rptend' : VF.StaveConnector.type.BOLD_DOUBLE_RIGHT,
      'invis' : null
    },

    vexTypesBarlineLeft : {
      'single' : VF.StaveConnector.type.SINGLE_LEFT,
      'dbl' : VF.StaveConnector.type.THIN_DOUBLE,
      'end' : VF.StaveConnector.type.BOLD_DOUBLE_LEFT,
      'rptstart' : VF.StaveConnector.type.BOLD_DOUBLE_LEFT,
      'invis' : null
    },

    init : function (config) {
      var me = this, vexType, topStave, bottomStave, vexConnector, label, labelMode, i, model, leftBarline, rightBarline;
      var models = config.models;
      var staves = config.staves;
      if (config.barlineInfo) {
        leftBarline = config.barlineInfo.leftBarline;
        rightBarline = config.barlineInfo.rightBarline;
      }
      var system_n = config.system_n;
      labelMode = config.labelMode;

      for (i in models) {
        model = models[i];

        vexType = (rightBarline) ? me.vexTypesBarlineRight[rightBarline] : me.vexTypes[model.symbol];
        topStave = staves[model.top_stave_n];
        bottomStave = staves[model.bottom_stave_n];

        if (typeof vexType === 'number' && topStave && bottomStave) {
          vexConnector = new VF.StaveConnector(topStave, bottomStave);
          vexConnector.setType(vexType);

          // TODO implement offset in VexFlow
          // offset nested connectors
          //if (model.ancestorSymbols) {
          //console.log(model.ancestorSymbols);
          //vexConnector.x_shift = -30;
          //}

          me.allVexConnectors.push(vexConnector);
          if (labelMode === 'full') {
            label = (system_n === 0) ? model.label : model.labelAbbr;
          } else if (labelMode === 'abbr') {
            label = model.labelAbbr;
          }
          if (label) {
            vexConnector.setText(label);
          }
        }

        if (leftBarline) {
          vexType = me.vexTypesBarlineLeft[leftBarline];
          if (typeof vexType === 'number' && topStave && bottomStave) {
            vexConnector = new VF.StaveConnector(topStave, bottomStave);
            vexConnector.setType(vexType);
            if (vexType === VF.StaveConnector.type.BOLD_DOUBLE_LEFT) {
              vexConnector.checkShift = true;
            }
            me.allVexConnectors.push(vexConnector);
          }
        }

      }
    },

    getAll : function () {
      return this.allVexConnectors;
    },

    setContext : function (ctx) {
      this.ctx = ctx;
      return this;
    },

    draw : function () {
      var me = this, i, j, conn, shift;
      for (i = 0, j = me.allVexConnectors.length; i < j; i += 1) {
        conn = me.allVexConnectors[i];
        if (conn.checkShift) {
          shift = conn.top_stave.getModifierXShift();
          if (shift > 0) {
            conn.setXShift(shift);
          }
        }
        conn.setContext(me.ctx).draw();
      }
    }
  };
/*
 * MEItoVexFlow, Measure class
 *
 * Author: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class Measure
   * @private
   *
   * @constructor
   * @param {Object} config The configuration object
   */
  var Measure = function (config) {
    this.init(config);
  };

  Measure.prototype = {

    /**
     * initializes the current MEI2VF.Measure object
     * @param {Object} config The configuration object
     */
    init : function (config) {
      var me = this;
      /**
       * @cfg {MEI2VF.System} system the parent system
       */
      me.system = config.system;
      /**
       * @cfg {Element} element the MEI element of the current measure
       */
      me.element = config.element;
      /**
       * @cfg {String} n The value of the measure's n attribute
       */
      me.n = config.element.getAttribute('n');
      /**
       * @cfg {Array} staves an array of the staves in the current
       * measure. Contains
       */
      me.staves = config.staves;
      /**
       * @cfg {MEI2VF.StaveVoices} voices The voices of all staves in the
       * current measure
       */
      me.voices = config.voices;
      /**
       * @cfg {MEI2VF.Connectors} startConnectors an instance of
       * MEI2VF.Connectors handling all left connectors (only the first measure
       * in a system has data)
       */
      me.startConnectors = new StaveConnectors(config.startConnectorCfg);
      /**
       * @cfg {MEI2VF.Connectors} inlineConnectors an instance of
       * MEI2VF.Connectors handling all right connectors
       */
      me.inlineConnectors = new StaveConnectors(config.inlineConnectorCfg);

      me.tieElements = config.tieElements;
      me.slurElements = config.slurElements;
      me.hairpinElements = config.hairpinElements;
      /**
       * @cfg {Element[]} tempoElements the MEI tempo elements in the
       * current measure
       */
      me.tempoElements = config.tempoElements;
      /**
       * @cfg {Object} tempoFont the font used for rendering tempo
       * specifications
       */
      me.tempoFont = config.tempoFont;
      /**
       * @cfg {Element[]} rehElements the MEI rehearsal mark elements in the
       * current measure
       */
      me.rehElements = config.rehElements;
      /**
       * @property {Number} meiW the width attribute of the measure element or
       * null if NaN
       */
      me.meiW = (config.readMeasureWidths) ? me.setMeiWidth(me.element) : null;
    },

    getSystem : function () {
      return this.system;
    },

    /**
     *  reads the width attribute of the specified element and converts it to a
     * number
     * @param {Element} element the element to process
     * @return {Number} the number of the attribute or null if NaN
     */
    setMeiWidth : function (element) {
      return +element.getAttribute('width') || null;
    },

    /**
     * gets the staves array of the current measure
     * @return {Array}
     */
    getStaves : function () {
      return this.staves;
    },

    /**
     * gets the voices object of the current measure
     * @return {MEI2VF.StaveVoices}
     */
    getVoices : function () {
      return this.voices;
    },

    getMeiElement : function () {
      return this.element;
    },

    /**
     * gets the x coordinate of the staff
     * @return {Number}
     */
    getX : function () {
      return this.getFirstDefinedStave().x;
    },

    /**
     * gets the number of the current staff as specified in the MEI code
     * @return {Number}
     */
    getNAttr : function () {
      return this.n;
    },
    getN : function () {
      return this.n;
    },
    /**
     * gets the first defined staff in the current measure
     * @return {Vex.Flow.Stave}
     */
    getFirstDefinedStave : function () {
      var me = this, i, j;
      for (i = 0, j = me.staves.length; i < j; i += 1) {
        if (me.staves[i]) {
          return me.staves[i];
        }
      }
      throw new RuntimeError('No staff found in the current measure.');
    },

    /**
     * Adds rehearsal marks encoded in reh elements in the current measure to
     * the corresponding Vex.Flow.Stave object
     */
    addRehearsalMarks : function () {
      var me = this, stave_n, vexStave, offsetX, i, j, rehElement;
      for (i = 0, j = me.rehElements.length; i < j; i++) {
        rehElement = me.rehElements[i];
        stave_n = rehElement.getAttribute('staff');
        vexStave = me.staves[stave_n];
        offsetX = (vexStave.getModifierXShift() > 0) ? -40 : 0;
        vexStave.modifiers.push(new VF.StaveSection(Util.getText(rehElement), vexStave.x + offsetX, 0));
      }
    },

    // TODO handle timestamps! (is it necessary to handle tempo element
    // as annotations?)
    // TODO make magic numbers constants
    // TODO move from here
    /**
     * Writes the data of the tempo elements in the current measure to the
     * corresponding Vex.Flow.Stave object
     */
    addTempoToStaves : function () {
      var me = this, offsetX, vexStave, vexTempo, atts, halfLineDistance, i, j, tempoElement;
      for (i = 0, j = me.tempoElements.length; i < j; i++) {
        tempoElement = me.tempoElements[i];

        atts = Util.attsToObj(tempoElement);
        vexStave = me.staves[atts.staff];
        halfLineDistance = vexStave.getSpacingBetweenLines() / 2;
        vexTempo = new VF.StaveTempo({
          name : Util.getText(tempoElement), duration : atts['mm.unit'], dots : +atts['mm.dots'], bpm : +atts.mm
        }, vexStave.x, 5);
        if (atts.vo) {
          vexTempo.setShiftY(+atts.vo * halfLineDistance);
        }
        offsetX = (vexStave.getModifierXShift() > 0) ? -14 : 14;

        // if a staff has a time signature, set the tempo on top of the time
        // signature instead of the first note
        if (vexStave.hasTimeSig()) {
          offsetX -= 24;
        }
        if (atts.ho) {
          offsetX += +atts.ho * halfLineDistance;
        }
        vexTempo.setShiftX(offsetX);
        vexTempo.font = me.tempoFont;
        vexStave.modifiers.push(vexTempo);
      }
    },

    /**
     * calculates the minimum width of the current measure
     */
    calculateMinWidth : function () {
      var me = this, i, staves, stave, repeatPadding, maxNoteStartX = 0, maxEndModifierW = 0;

      staves = me.staves;
      i = staves.length;
      while (i--) {
        stave = staves[i];
        if (stave) {
          // max start modifier width
          maxNoteStartX = Math.max(maxNoteStartX, stave.getNoteStartX());
          // max end modifier width
          maxEndModifierW = Math.max(maxEndModifierW, stave.getGlyphEndX() - stave.end_x);
        }
      }

      /**
       * @property {Number} maxNoteStartX the maximum note_start_x value of all
       * Vex.Flow.Stave objects in the current measure
       */
      me.maxNoteStartX = maxNoteStartX;
      /**
       * @property {Number} maxEndModifierW the maximum width of the end
       * modifiers in all Vex.Flow.Stave objects in the current measure
       */
      me.maxEndModifierW = maxEndModifierW;

      // calculate additional padding (20px) if the staff does have a left REPEAT_BEGIN barline
      // located to the right of other staff modifiers; 0px in all other cases.
      stave = me.getFirstDefinedStave();
      repeatPadding =
      (stave.modifiers[0].barline == VF.Barline.type.REPEAT_BEGIN && stave.modifiers.length > 2) ? 20 : 0;

      /**
       * @property {Number} minVoicesW the minimum width of the voices in the
       * measure
       */
      me.minVoicesW = me.voices.preFormat();

      me.voiceFillFactor = me.voices.getFillFactor();

      /**
       * @property {Number} minWidth the minimum width of the measure
       */
      me.minWidth = maxNoteStartX + maxEndModifierW + repeatPadding + me.minVoicesW;
    },

    getVoiceFillFactor : function () {
      return this.voiceFillFactor;
    },

    /**
     * gets the final width of the current measure
     */
    getW : function () {
      return this.w;
    },

    /**
     * gets the minimum width of the current measure
     */
    getMinWidth : function () {
      return this.minWidth;
    },

    setFinalWidth : function (additionalWidth) {
      var me = this;
      me.w = (me.meiW === null) ? me.minWidth + (additionalWidth * me.voiceFillFactor) : me.meiW;
    },

    /**
     * Formats the staves in the current measure: sets x coordinates and adds
     * staff labels
     * @param {Number} x The x coordinate of the the measure
     * @param {String[]} labels The labels of all staves
     */
    format : function (x, labels) {
      var me = this, width = me.w, i = me.staves.length, stave, k;
      while (i--) {
        if (me.staves[i]) {
          stave = me.staves[i];
          if (labels && typeof labels[i] === 'string') {
            stave.setText(labels[i], VF.Modifier.Position.LEFT, {
              shift_y : -3
            });
          }

          if (typeof stave.setX == "function") {
            stave.setX(x);
          } else {
            /* Fallback if VexFlow doesn't have setter */
            //TODO: remove when setX() is merged to standard VexFlow
            stave.x = x;
            stave.glyph_start_x = x + 5;
            stave.bounds.x = x;
            for (k = 0; k < stave.modifiers.length; k++) {
              stave.modifiers[k].x = x;
            }
          }

          stave.start_x = stave.x + me.maxNoteStartX;
          stave.setWidth(width);
          stave.end_x -= me.maxEndModifierW;

        }
      }
      me.voices.format(me.getFirstDefinedStave());
    },

    /**
     * Draws the staves, voices and connectors in the current measure to a
     * canvas
     * @param {Object} ctx the canvas context
     */
    draw : function (ctx) {
      var me = this, i, staves, staff;
      staves = me.staves;
      i = staves.length;
      while (i--) {
        staff = staves[i];
        if (staff) {
          staff.setContext(ctx).draw();
        }
      }
      me.voices.draw(ctx, staves);
      me.startConnectors.setContext(ctx).draw();
      me.inlineConnectors.setContext(ctx).draw();
    }
  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var Page = function () {
    this.init();
  };

  Page.prototype = {

    STAVE_HEIGHT : 40,

    init : function () {
      var me = this;
      /**
       * Contains all {@link System} objects
       * @property {System[]} systems
       */
      me.systems = [];
    },

    formatSystems : function (pageInfo, systemInfo, cfg, ctx) {
      var me = this, i, j, totalMinSystemWidth = 0, minSystemWidth, broadestSystemN = 1;
      var systems = me.systems;
      j = systems.length;

      // calculate page width if me.cfg.pageWidth is falsy
      if (!cfg.pageWidth) {
        for (i = 0; i < j; i++) {
          minSystemWidth = systems[i].preFormat(ctx);
          if (totalMinSystemWidth < minSystemWidth) {
            broadestSystemN = i;
            totalMinSystemWidth = minSystemWidth;
          }
        }

        // calculate the width of all systems based on the final width of the system with the
        // largest minSystemWidth and the default space to be added to each measure
        var totalSystemWidth = totalMinSystemWidth +
                               (systems[broadestSystemN].voiceFillFactorSum * cfg.defaultSpacingInMeasure);
        pageInfo.setPrintSpaceWidth(totalSystemWidth);

        for (i = 0; i < j; i++) {
          systems[i].setFinalMeasureWidths(totalSystemWidth);
          systems[i].format(ctx);
        }

      } else {
        // ... if me.cfg.pageWidth is specified, format the measures based on that width
        for (i = 0; i < j; i++) {
          minSystemWidth = systems[i].preFormat(ctx);
          systems[i].setFinalMeasureWidths();
          systems[i].format(ctx);
        }
      }

      pageInfo.setLowestY(systemInfo.getCurrentLowestY() + me.STAVE_HEIGHT);

    },

    addSystem : function (system, n) {
      this.systems[n] = system;
    },

    getSystems : function () {
      return this.systems;
    },

    setContext : function(ctx) {
      this.ctx = ctx;
      return this;
    },

    drawSystems : function () {
      var me = this, i, j, systems = me.systems, ctx = me.ctx;
      j = systems.length;
      for (i = 0; i < j; i++) {
        systems[i].draw(ctx);
      }
    }


  };
/*
 * (C) Copyright 2014 Alexander Erhard (http://alexandererhard.com/).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */



  var PageInfo = function (config) {

    var me = this;

    me.pageTopMar = config.pageTopMar;
    me.pageLeftMar = config.pageLeftMar;
    me.pageRightMar = config.pageRightMar;
    me.pageBottomMar = config.pageBottomMar;

    /**
     * The print space coordinates calculated from the page config.
     * @property {Object} printSpace
     * @property {Number} printSpace.top
     * @property {Number} printSpace.left
     * @property {Number} printSpace.right
     * @property {Number} printSpace.width
     */
    me.printSpace = {
      // substract four line distances (40px) from pageTopMar in order
      // to compensate VexFlow's default top spacing / allow specifying
      // absolute values
      top : config.pageTopMar - 40,
      left : config.pageLeftMar,
      // not in use:
      //right : config.pageWidth - config.pageRightMar,
      width : (config.pageWidth === null) ? null : Math.floor(config.pageWidth - config.pageRightMar - config.pageLeftMar) - 1
    };

  };


  PageInfo.prototype = {

    getPrintSpace : function () {
      return this.printSpace;
    },

    setPrintSpaceWidth : function (width) {
      var me = this;
      me.printSpace.width = width;
      me.widthCalculated = true;
    },

    hasCalculatedWidth : function () {
      return !!this.widthCalculated;
    },

    getCalculatedWidth : function () {
      var me = this;
      return me.printSpace.width + me.pageLeftMar + me.pageRightMar;
    },

    setLowestY : function (lowestY) {
      this.lowestY = lowestY;
    },

    getLowestY : function () {
      return this.lowestY;
    },

    getCalculatedHeight : function () {
      return this.lowestY + this.pageBottomMar;
    }

  };
/*
 * MEItoVexFlow, Verses class
 *
 * Author: Zoltan Komives
 * Contributor: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class MEI2VF.Verses
   * @private
   *
   * @constructor
   * @param {Object} config
   */
  var Verses = function (config) {
    var me = this;
    me.systemVerses = {};
    me.lowestYs = {};
    me.font = config.font;
    me.maxHyphenDistance = config.maxHyphenDistance;
  };

  Verses.prototype = {

    /**
     * @public
     * @param annot
     * @param element
     * @param stave_n
     * @returns {Verses}
     */
    addSyllable : function (annot, element, stave_n) {
      var me = this, verse_n;

      var wordpos = element.getAttribute('wordpos');

      var parentNode = element.parentNode;
      if (parentNode.localName === 'verse' && parentNode.hasAttribute('n')) {
        verse_n = parentNode.getAttribute('n');
      } else {
        verse_n = '1';
      }

      if (!me.systemVerses[stave_n]) {
        me.systemVerses[stave_n] = {};
      }

      if (!me.systemVerses[stave_n][verse_n]) {
        me.systemVerses[stave_n][verse_n] = {
          syllables: [],
          hyphenation : me.newHyphenation()
        };
      }

      me.systemVerses[stave_n][verse_n].syllables.push(annot);

      if (wordpos) {
        me.systemVerses[stave_n][verse_n].hyphenation.addSyllable(annot, wordpos);
      }
      return me;
    },

    /**
     * @public
     */
    getLowestYs : function () {
      return this.lowestYs;
    },

    /**
     * @public
     */
    getLowestY : function (stave_n) {
      return this.lowestYs[stave_n];
    },

    /**
     * @private
     */
    newHyphenation : function () {
      return new Hyphenation(this.font, this.maxHyphenDistance);
    },

    /**
     * @public
     * @returns {Verses}
     */
    format : function () {
      var me = this, stave_n, verse_n, text_line, verse, i, j, lowestY, padding, lowestTextLine;
      var notesInContext;

      padding = 20;

      me.font.size=15;

      var spacing_between_lines = 10;
      var height_in_lines = me.font.size / spacing_between_lines * 1.5;

      for (stave_n in me.systemVerses) {
        text_line = 0;
        lowestTextLine = 0;
        lowestY = -20;

        for (verse_n in me.systemVerses[stave_n]) {
          verse = me.systemVerses[stave_n][verse_n].syllables;
          lowestY += padding;
          // first pass: get lowest y
          for (i = 0, j = verse.length; i < j; i++) {
            verse[i].setTextLine(text_line);

            notesInContext = verse[i].getModifierContext().modifiers.stavenotes;

            if (notesInContext.length > 1) {
              verse[i].setNote(notesInContext[0]);
            }

            // TODO compare lowest Ys


            lowestY = Math.max(lowestY, verse[i].preProcess());

//            lowestTextLine = Math.max(lowestTextLine, verse[i].text_line);
          }
          // second pass: set lowest y
          for (i = 0; i < j; i++) {
            verse[i].setY(lowestY);
//            verse[i].setTextLine(lowestTextLine);
          }
          lowestTextLine += height_in_lines;
        }
        me.lowestYs[stave_n] = lowestY;

      }
      return me;
    },

    /**
     * @public
     * @param ctx
     * @param leftX
     * @param rightX
     * @returns {Verses}
     */
    drawHyphens : function (ctx, leftX, rightX) {
      var me = this, stave_n, verse_n;
      for (stave_n in me.systemVerses) {
        for (verse_n in me.systemVerses[stave_n]) {
          me.systemVerses[stave_n][verse_n].hyphenation.setContext(ctx).draw(leftX, rightX);
        }
      }
      return me;
    }

  };
/*
 * MEItoVexFlow, System class
 *
 * Author: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * A single instance of a staff system, containing and processing information
   * about the measures contained
   * @class System
   * @private
   *
   * @param pageInfo
   * @param systemInfo
   * @param system_n
   * @constructor
   */
  var System = function (pageInfo, systemInfo, system_n) {
    this.init(pageInfo, systemInfo, system_n);
  };

  System.prototype = {

    /**
     * @property {Number} LABEL_PADDING the padding (in pixels) between the voice
     * labels and the staves
     */
    LABEL_PADDING : 20,

    /**
     *
     * @param pageInfo
     * @param systemInfo
     * @param system_n
     */
    init : function (pageInfo, systemInfo, system_n) {
      var me = this;

      /**
       * @cfg {Number|null} leftMar the left system margin as specified in the
       * MEI file or null if there is no margin specified. In the latter case,
       * the margin will be calculated on basis of the text width of the labels
       */
      me.leftMar = systemInfo.getLeftMar();
      /**
       * @cfg {Object} coords the coords of the current system
       * @cfg {Number} coords.x the x coordinate of the system
       * @cfg {Number} coords.y the y coordinate of the system
       * @cfg {Number} coords.width the system width
       */
      var printSpace = pageInfo.getPrintSpace();
      me.coords = {
        x : printSpace.left,
        y : (system_n === 0) ? printSpace.top : systemInfo.getCurrentLowestY() + systemInfo.cfg.systemSpacing,
        width : printSpace.width
      };
      /**
       * @cfg {Number[]} staveYs the y coordinates of all staves in the current
       * system
       */
      me.staveYs = systemInfo.getYs(me.coords.y);
      /**
       * an instance of MEI2VF.Verses dealing with and storing all verse lines
       * found in the MEI document
       * @property {MEI2VF.Verses} verses
       */
      me.verses = new Verses(systemInfo.getVerseConfig());
      /**
       * @cfg {String[]} labels the labels of all staves in the current system
       */
      me.labels = systemInfo.getStaveLabels(system_n);
      /**
       * @property {MEI2VF.Measure[]} measures the measures in the current
       * system
       */
      me.measures = [];
      me.systemVoiceYBounds = [];
    },

    /**
     * @return {Number[]} the value of {@link #staveYs}
     */
    getStaveYs : function () {
      return this.staveYs;
    },

    /**
     * adds a measure to the end of the measure array
     * @param {MEI2VF.Measure} measure the measure to add
     */
    addMeasure : function (measure) {
      this.measures.push(measure);
    },

    /**
     * gets a measure in the current system at the specified index
     * @param {Number} i the measure index (the first measure in the current
     * system has the index 0)
     * @return {MEI2VF.Measure}
     */
    getMeasure : function (i) {
      return this.measures[i];
    },

    /**
     * gets all measures in the current system
     * @return {MEI2VF.Measure[]}
     */
    getMeasures : function () {
      return this.measures;
    },

    getLastMeasure : function () {
      return this.measures[this.measures.length - 1];
    },

    /**
     * Calculates the system indent based on the width of the stave and
     * stave-connector labels
     * @param {Object} ctx the canvas context
     */
    calculateLeftMar : function (ctx) {
      var me = this, label, max = 0, w, connectors, i, text;
      ctx.setFont('Times', 16);
      for (label in me.labels) {
        text = me.labels[label];
        if (typeof text === 'string') {
          w = ctx.measureText(me.labels[label]).width;
          if (max < w) {
            max = w;
          }
        }
      }
      connectors = me.getMeasures()[0].startConnectors.getAll();
      i = connectors.length;
      while (i--) {
        text = connectors[i].text;
        if (typeof text === 'string') {
          w = ctx.measureText(me.labels[label]).width;
          if (max < w) {
            max = w;
          }
        }
      }
      me.leftMar = (max === 0) ? 0 : max + me.LABEL_PADDING;
    },

    /**
     * Calculates the minimum width of each measure in the current system
     */
    calculateMinMeasureWidths : function () {
      var measures = this.measures, i = measures.length;
      while (i--) {
        measures[i].calculateMinWidth();
      }
    },

    /**
     * calculates the minimum width of all measures in a stave
     */
    calculateMinSystemWidth : function () {
      var me = this, i, j, totalSpecifiedMeasureWidth = 0, voiceFillFactorSum = 0;
      for (i = 0, j = me.measures.length; i < j; i += 1) {
        if (me.measures[i].meiW === null) {
          totalSpecifiedMeasureWidth += me.measures[i].getMinWidth();
          voiceFillFactorSum += me.measures[i].getVoiceFillFactor();
        } else {
          totalSpecifiedMeasureWidth += me.measures[i].meiW;
        }
      }
      me.minSystemWidth = totalSpecifiedMeasureWidth;
      me.voiceFillFactorSum = voiceFillFactorSum;
    },

    /**
     * sets the final width of all measures in a stave
     */
    setFinalMeasureWidths : function (overrideWidth) {
      var me = this, i, j, singleAdditionalWidth;

      var totalWidth = overrideWidth || me.coords.width;

      singleAdditionalWidth = Math.floor((totalWidth - me.leftMar - me.minSystemWidth) / me.voiceFillFactorSum);

      for (i = 0, j = me.measures.length; i < j; i += 1) {
        me.measures[i].setFinalWidth(singleAdditionalWidth);
      }
    },

    preFormat : function (ctx) {
      var me = this;
      if (typeof me.leftMar !== 'number') {
        me.calculateLeftMar(ctx);
      }
      me.calculateMinMeasureWidths();
      me.calculateMinSystemWidth();
      return me.minSystemWidth + me.leftMar;
    },

    /**
     * formats the measures in the current system
     * @return {System} this
     */
    format : function () {
      var me = this, i, j, measures, offsetX, labels;
      offsetX = me.coords.x + me.leftMar;
      measures = me.getMeasures();
      j = measures.length;
      for (i = 0; i < j; i += 1) {
        if (measures[i]) {
          labels = (i === 0) ? me.labels : null;
          measures[i].format(offsetX, labels);
          //me.updateSystemVoiceYBounds(measures[i].getVoices().getYBounds());

          offsetX += measures[i].getW();
        }
        measures[i].addRehearsalMarks();
        measures[i].addTempoToStaves();
      }

      if (j > 0) {
        me.slurStartX = measures[0].getFirstDefinedStave().getTieStartX();
        me.slurEndX = me.getLastMeasure().getFirstDefinedStave().getTieEndX();
      }

      me.verses.format();
      return me;
    },

    updateSystemVoiceYBounds : function(bounds) {
      var me = this;
      me.systemVoiceYBounds.push(bounds);
      console.log(me.systemVoiceYBounds);
    },


    getSlurStartX : function () {
      return this.slurStartX;
    },

    getSlurEndX : function () {
      return this.slurEndX;
    },

    /**
     * draws the current system to a canvas
     * @param {Object} ctx the canvas context
     */
    draw : function (ctx) {
      var me = this, i = me.measures.length;
      while (i--) {
        if (me.measures[i]) {
          me.measures[i].draw(ctx);
        }
      }
      me.verses.drawHyphens(ctx, me.slurStartX, me.slurEndX);
    }
  };
/*
 * StaveInfo.js Author: Zoltan Komives (zolaemil@gmail.com) Created: 03.07.2013
 *
 * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/*
 * Contributors and additions: Alexander Erhard, @davethehat
 */



  /**
   * @class MEI2VF.StaveInfo
   * Contains the definition and the rendering information (i.e. what
   * clef modifiers are to be rendered) of a single staff
   * @private
   *
   * @constructor
   * @param staffDef
   * @param scoreDef
   * @param w_clef
   * @param w_keysig
   * @param w_timesig
   */
  var StaveInfo = function (staffDef, scoreDef, w_clef, w_keysig, w_timesig) {
    var me = this;
    /**
     * @private
     */
    me.renderWith = {
      clef : w_clef,
      keysig : w_keysig,
      timesig : w_timesig
    };
    /**
     * the currently valid keySpec
     * @private
     */
    me.keySpec = {key : 'C', meiElement : staffDef}; // default key
    /**
     * the currently valid timeSpec
     * @private
     */
    me.timeSpec = {};
    /**
     * the currently valid staff labels
     * @private
     */
    me.labels = null;
    /**
     * the currently valid stave spacing
     * @private
     */
    me.spacing = null;
    /**
     * the currently valid clef
     * @private
     */
    me.clef = {};
    /**
     * a copy of the start clef of a measure-stave; used when there are clef changes in multi-voice staves
     */
    me.startClefCopy = null;

    me.updateDef(staffDef, scoreDef, true);
    me.updateRenderWithFromMEI();
  };

  StaveInfo.prototype = {

    /**
     * @private
     */
    clefTypeMap : {
      G : 'treble',
      G1 : 'french',
      G2 : 'treble',
      F3 : 'baritone-f',
      F4 : 'bass',
      F5 : 'subbass',
      C1 : 'soprano',
      C2 : 'mezzo-soprano',
      C3 : 'alto',
      C4 : 'tenor',
      C5 : 'baritone-c',
      perc : 'percussion'
    },

    getCurrentScoreDef : function () {
      return this.currentScoreDef;
    },

    /**
    * @public
    */
    updateRenderWithFromMEI : function() {

      if (this.keySpec.meiElement && this.keySpec.meiElement.hasAttribute('key.sig.show')) {
        this.renderWith.keysig = this.getKeySigShow();
      }
      if (this.clef.meiElement && this.clef.meiElement.hasAttribute('clef.visible')) {
        this.renderWith.clef = this.getClefVisible();
      }
      if (this.timeSpec.meiElement && this.timeSpec.meiElement.hasAttribute('meter.rend')) {
        this.renderWith.timesig = this.getMeterRend();
      }
    },

    /**
     * @public
     * @param staffDef
     * @param scoreDef
     * @param skipRenderWith
     */
    updateDef : function (staffDef, scoreDef, skipRenderWith) {
      var me = this, clefDefiningElement, timeSigDefiningElement, keySigDefiningElement;

      me.currentScoreDef = scoreDef;

      var getDefiningElement = function (element1, element2, att) {
        if (element1 && element1.hasAttribute(att)) {
          return element1;
        }
        if (element2 && element2.hasAttribute(att)) {
          return element2;
        }
      };

      clefDefiningElement = getDefiningElement(staffDef, scoreDef, 'clef.shape');
      keySigDefiningElement = getDefiningElement(staffDef, scoreDef, 'key.pname');
      timeSigDefiningElement = getDefiningElement(staffDef, scoreDef, 'meter.count');

      if (!skipRenderWith) {
        me.updateRenderWith(clefDefiningElement, keySigDefiningElement, timeSigDefiningElement);
      }

      if (clefDefiningElement) me.updateClef(clefDefiningElement);
      if (keySigDefiningElement) me.updateKeySpec(keySigDefiningElement);
      if (timeSigDefiningElement) me.updateTimeSpec(timeSigDefiningElement);

      // TODO currently, labels and spacing are only read from <staffDef>
      if (staffDef) {
        me.updateLabels(staffDef);
        me.updateSpacing(staffDef);
      }

    },

    /**
     * updated the definition from a <scoreDef> only if the <scoreDef> hasn't been processed yet with a <staffDef>
     * @param scoreDef
     */
    updateIfNew : function (scoreDef) {
      var me = this;
      if (scoreDef !== me.currentScoreDef) {
        me.updateDef(null, scoreDef);
      }
    },

    /**
     * @private
     * @param clefDefiningElement
     * @param keySigDefiningElement
     * @param timeSigDefiningElement
     */
    updateRenderWith : function (clefDefiningElement, keySigDefiningElement, timeSigDefiningElement) {
      var me = this, result, hasEqualAtt;

      result = {
        clef : false,
        keysig : false,
        timesig : false
      };

      hasEqualAtt = function (currentElement, newElement, attr_name) {
        return currentElement.getAttribute(attr_name) === newElement.getAttribute(attr_name);
      };

      var hasEqualClefAtt = function (currentElement, newElement, currentPrefix, newPrefix, attr_name) {
        return currentElement.getAttribute(currentPrefix + attr_name) === newElement.getAttribute(newPrefix + attr_name);
      };

      var currentClefElement = me.clef.meiElement;
      var currentKeySigElement = me.keySpec.meiElement;
      var currentTimeSigElement = me.timeSpec.meiElement;

      if (clefDefiningElement) {
        var currentPrefix = (currentClefElement.localName === 'clef') ? '' : 'clef.';
        var newPrefix = (clefDefiningElement.localName === 'clef') ? '' : 'clef.';
        if (!hasEqualClefAtt(currentClefElement, clefDefiningElement, currentPrefix, newPrefix, 'shape') ||
            !hasEqualClefAtt(currentClefElement, clefDefiningElement, currentPrefix, newPrefix, 'line')) {
          result.clef = true;
        }
      }

      if (keySigDefiningElement && (!hasEqualAtt(currentKeySigElement, keySigDefiningElement, 'key.pname') ||
                                    !hasEqualAtt(currentKeySigElement, keySigDefiningElement, 'key.accid') ||
                                    !hasEqualAtt(currentKeySigElement, keySigDefiningElement, 'key.mode'))) {
        result.keysig = true;
      }
      if (timeSigDefiningElement && (!hasEqualAtt(currentTimeSigElement, timeSigDefiningElement, 'meter.count') ||
                                     !hasEqualAtt(currentTimeSigElement, timeSigDefiningElement, 'meter.unit') ||
                                     !hasEqualAtt(currentTimeSigElement, timeSigDefiningElement, 'meter.sym'))) {
        result.timesig = true;
      }

      me.renderWith = result;
    },

    /**
     * @private
     */
    updateLabels : function (staffDef) {
      var me = this, label, labelAbbr;
      label = staffDef.getAttribute('label');
      if (typeof label === 'string') {
        me.label = label;
      }
      labelAbbr = staffDef.getAttribute('label.abbr');
      if (typeof labelAbbr === 'string') {
        me.labelAbbr = labelAbbr;
      }
    },

    /**
     * @private
     */
    updateSpacing : function (staffDef) {
      var me = this, spacing;
      spacing = staffDef.getAttribute('spacing');
      if (spacing !== null && !isNaN(spacing)) {
        me.spacing = +spacing;
      }
      return me.spacing;
    },

    /**
     * @private
     * @param element
     * @returns {*}
     */
    updateClef : function (element) {
      var me = this, clefShape, clefDis, clefDisPlace, clefType, prefix;

      // prefix for clef attribute names
      prefix = (element.localName === 'clef') ? '' : 'clef.';

      clefShape = element.getAttribute(prefix + 'shape');
      if (!clefShape) {
        Logger.warn('@clef.shape expected', 'No clef shape attribute found in ' + Util.serializeElement(element) +
                                            '. Setting default clef.shape "G".');
        clefShape = 'G';
      }
      clefType = clefShape + (element.getAttribute(prefix + 'line') || '');
      clefDis = element.getAttribute(prefix + 'dis');
      clefDisPlace = element.getAttribute(prefix + 'dis.place');

      var type = me.clefTypeMap[clefType];
      if (type) {
        if (clefDis === '8' && clefDisPlace === 'below') {
          me.clef = {
            type : type,
            shift : -1,
            meiElement : element
          };
        } else {
          me.clef = {
            type : type,
            meiElement : element
          };
        }
      } else {
        me.clef = {
          type : 'treble',
          meiElement : null
        };
        Logger.warn('Not supported', 'Clef definition in ' + Util.serializeElement(element) +
                                     ' is not supported. Setting default treble clef.');
      }
    },

    /**
     * @private
     */
    updateTimeSpec : function (element) {
      var me = this;
      me.timeSpec = {
        count : +element.getAttribute('meter.count'),
        unit : +element.getAttribute('meter.unit'),
        sym : element.getAttribute('meter.sym'),
        meiElement : element
      };
    },

    /**
     * @private
     */
    updateKeySpec : function (element) {
      var me = this;
      me.keySpec = {
        key : me.convertKeySpec(element),
        meiElement : element
      };
    },

    /**
     * @private
     * @param element
     * @returns {*}
     */
    convertKeySpec : function (element) {
      var keyname, key_accid, key_mode;
      keyname = element.getAttribute('key.pname').toUpperCase();
      key_accid = element.getAttribute('key.accid');
      if (key_accid !== null) {
        switch (key_accid) {
          case 's' :
            keyname += '#';
            break;
          case 'f' :
            keyname += 'b';
            break;
          default :
            Logger.warn('Not supported', 'expected to find value "s" or "f" instead of "' + key_accid +
                                         '" in @key.accid of ' + Util.serializeElement(element) +
                                         '. Ignoring processing of this attribute.');
        }
      }
      key_mode = element.getAttribute('key.mode');
      if (key_mode !== null) {
        keyname += (key_mode === 'major') ? '' : 'm';
      }
      return keyname;
    },


    /**
     * @public
     * @param clefElement
     */
    clefChangeInMeasure : function (clefElement) {
      var me = this;
      if (!me.startClefCopy) {
        me.startClefCopy = {
          type : me.clef.type,
          size : me.clef.size,
          shift : me.clef.shift
        };
      }
      me.updateClef(clefElement);
      return me.clef;
    },

    /**
     * called at the beginning of each layer. Sets the clef to the initial clef of the stave and saves
     * any existing clef to this.changedClef
     * @public
     */
    checkInitialClef : function () {
      var me = this;
      if (me.startClefCopy) {
        me.changedClef = me.clef;
        me.clef = me.startClefCopy;
      }
    },

    /**
     * called after the last layer. Removes this.startClefCopy and sets the current clef to the last
     * clef change
     * @public
     */
    finalizeClefInfo : function () {
      var me = this;
      if (me.changedClef) {
        me.clef = me.changedClef;
        me.changedClef = null;
      }
      me.startClefCopy = null;
    },

    /**
     * @public
     */
    forceSectionStartInfo : function () {
      this.renderWith = {
        clef: true,
        keysig:true,
        timesig: true
      }
    },

    /**
     * @public
     */
    forceStaveStartInfo : function () {
      var me = this;
      me.renderWith.clef = true;
      me.renderWith.keysig = true;
    },

    /**
     * @public
     */
    showClefCheck : function () {
      var me = this;
      if (me.renderWith.clef && me.getClefVisible()) {
        me.renderWith.clef = false;
        return true;
      }
    },

    /**
     * @public
     */
    showKeysigCheck : function () {
      var me = this;
      if (me.renderWith.keysig && me.getKeySigShow()) {
        me.renderWith.keysig = false;
        return true;
      }
    },

    /**
     * @public
     */
    showTimesigCheck : function () {
      var me = this;
      if (me.renderWith.timesig) {
        me.renderWith.timesig = false;
        if (me.getMeterRend()) {
          return true;
        }
      }
    },

    /**
     * @public
     */
    getMeterRend : function() {
      return this.timeSpec.meiElement && this.timeSpec.meiElement.getAttribute('meter.rend') !== 'invis'
    },

    /**
     * @public
     */
    getKeySigShow : function() {
      return this.keySpec.meiElement && this.keySpec.meiElement.getAttribute('key.sig.show') !== 'false';
    },

    /**
     * @public
     */
    getClefVisible : function() {
      return this.clef.meiElement && this.clef.meiElement.getAttribute('clef.visible') !== 'false';
    },


    /**
     * @public
     */
    getClef : function () {
      return this.clef;
    },

    /**
     * @public
     */
    getKeySpec : function () {
      return this.keySpec;
    },

    /**
     * @public
     */
    getTimeSpec : function () {
      return this.timeSpec;
    }

  };
/*
 * MEItoVexFlow, SystemInfo class
 *
 * Author: Alexander Erhard
 * (process... methods based on meitovexflow.js)
 * Contributor: @davethehat
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


  /**
   * @class MEI2VF.SystemInfo
   * Deals with MEI data provided by scoreDef, staffDef and staffGrp elements and its children
   * @private
   *
   * @constructor

   */
  var SystemInfo = function () {
  };

  SystemInfo.prototype = {

    STAVE_HEIGHT : 40,

    init : function (cfg) {
      var me = this;
      me.cfg = cfg;

      /**
       * contains the current {@link MEI2VF.StaveInfo} objects
       */
      me.currentStaveInfos = [];
      /**
       * @property {Number} systemLeftMar the left margin of the
       * current system (additional to the left print space margin)
       */
      me.systemLeftMar = null;
      /**
       * @property {Number} currentLowestY the lowest Y coordinate of the
       * previously processed staves
       */
      me.currentLowestY = 0;

      me.startConnectorInfos = {};
      me.inlineConnectorInfos = {};

    },

    setLeftMar : function (width) {
      this.systemLeftMar = width;
    },

    getLeftMar : function () {
      return this.systemLeftMar;
    },

    /**
     * @method
     */
    setConnectorModels : function (staffGrp, range, isChild, ancestorSymbols) {
      var me = this, symbol, barthru, first_n, last_n;

      var setModelForStaveRange = function (target, obj, add) {
        add = add || '';
        target[obj.top_stave_n + ':' + obj.bottom_stave_n + add] = obj;
      };

      first_n = range.first_n;
      last_n = range.last_n;
      symbol = staffGrp.getAttribute('symbol');

      Logger.debug('Converter.setConnectorModels() {2}', 'symbol: ' + symbol, ' range.first_n: ' +
                                                                              first_n, ' range.last_n: ' + last_n);

      // 1. left connectors specified in the MEI file:
      setModelForStaveRange(me.startConnectorInfos, {
        top_stave_n : first_n,
        bottom_stave_n : last_n,
        symbol : symbol || 'line',
        label : staffGrp.getAttribute('label'),
        labelAbbr : staffGrp.getAttribute('label.abbr'),
        ancestorSymbols : ancestorSymbols
      });

      // 2. left auto line, only (if at all) attached to
      // //staffGrp[not(ancestor::staffGrp)]
      if (!isChild && me.cfg.autoStaveConnectorLine) {
        setModelForStaveRange(me.startConnectorInfos, {
          top_stave_n : first_n,
          bottom_stave_n : last_n,
          symbol : (symbol === 'none') ? 'none' : 'line'
        }, 'autoline');
      }

      // 3. inline connectors
      if (staffGrp.getAttribute('barthru') === 'true') {
        setModelForStaveRange(me.inlineConnectorInfos, {
          top_stave_n : first_n,
          bottom_stave_n : last_n,
          symbol : 'singleright' // default
        });
      }
    },

    getStaveInfo : function (stave_n) {
      return this.currentStaveInfos[stave_n];
    },

    getAllStaveInfos : function () {
      return this.currentStaveInfos;
    },


    /**
     * @method getStaveLabels
     */
    getStaveLabels : function (currentSystem_n) {
      var me = this, labels, i, infos, labelType;
      labels = {};
      if (!me.cfg.labelMode) {
        return labels;
      }
      labelType = (me.cfg.labelMode === 'full' && currentSystem_n === 0) ? 'label' : 'labelAbbr';
      infos = me.getAllStaveInfos();
      i = infos.length;
      while (i--) {
        if (infos[i]) {
          labels[i] = infos[i][labelType];
        }
      }
      return labels;
    },

    getVerseConfig : function () {
      var me = this;
      return {
        font : me.cfg.lyricsFont, maxHyphenDistance : me.cfg.maxHyphenDistance
      };
    },

    /**
     * @method
     */
    getClef : function (stave_n) {
      var me = this, staveInfo;
      staveInfo = me.currentStaveInfos[stave_n];
      if (!staveInfo) {
        throw new RuntimeError('No staff definition for staff n="' + stave_n + '"');
      }
      return staveInfo.getClef();
    },

    getCurrentLowestY : function () {
      return this.currentLowestY;
    },

    setCurrentLowestY : function (y) {
      this.currentLowestY = y;
    },

    getYs : function (currentSystemY) {
      var me = this, currentStaveY, i, j, isFirstStave = true, infoSpacing, lowestYCandidate, ys = [];
      currentStaveY = 0;
      for (i = 1, j = me.currentStaveInfos.length; i < j; i += 1) {
        if (me.currentStaveInfos[i]) {
          infoSpacing = me.currentStaveInfos[i].spacing;
          currentStaveY += (isFirstStave) ? 0 :
                           (infoSpacing !== null) ? me.STAVE_HEIGHT + me.currentStaveInfos[i].spacing :
                           me.STAVE_HEIGHT + me.cfg.staveSpacing;
          ys[i] = currentSystemY + currentStaveY;
          isFirstStave = false;
        }
      }
      lowestYCandidate = currentSystemY + currentStaveY + me.STAVE_HEIGHT;
      if (lowestYCandidate > me.currentLowestY) {
        me.currentLowestY = lowestYCandidate;
      }
      return ys;
    },

    forceSectionStartInfos : function () {
      var me = this, i = me.currentStaveInfos.length;
      while (i--) {
        if (me.currentStaveInfos[i]) {
          me.currentStaveInfos[i].forceSectionStartInfo();
        }
      }
    },

    forceStaveStartInfos : function () {
      var me = this, i = me.currentStaveInfos.length;
      while (i--) {
        if (me.currentStaveInfos[i]) {
          me.currentStaveInfos[i].forceStaveStartInfo();
        }
      }
    },

    /**
     *
     */
    processScoreDef : function (scoredef) {
      var me = this, i, j, children, systemLeftmar;
      me.scoreDefElement = scoredef;
      systemLeftmar = parseFloat(me.scoreDefElement.getAttribute('system.leftmar'));
      if (!isNaN(systemLeftmar)) {
        me.setLeftMar(systemLeftmar);
      }
      children = me.scoreDefElement.childNodes;

      for (i = 0, j = children.length; i < j; i += 1) {
        if (children[i].nodeType === 1) {
          me.processScoreDef_child(children[i]);
        }
      }

      me.updateStaffDefs(scoredef);

    },

    /**
     * process scoreDef in all system which didn't get updated by a staffDef child of the current scoreDef
     * @param scoredef
     */
    updateStaffDefs : function (scoredef) {
      var me = this, i = me.currentStaveInfos.length;
      while (i--) {
        if (me.currentStaveInfos[i] && me.currentStaveInfos[i].getCurrentScoreDef() !== scoredef) {
          me.currentStaveInfos[i].updateDef(null, scoredef);
        }
      }
    },


    /**
     * MEI element <b>scoreDef</b> may contain (MEI v2.1.0):
     * MEI.cmn: <b>meterSig</b> <b>meterSigGrp</b>
     * MEI.harmony: <b>chordTable</b> MEI.linkalign:
     * <b>timeline</b> MEI.midi: <b>instrGrp</b> MEI.shared:
     * <b>keySig</b> <b>pgFoot</b> <b>pgFoot2</b> <b>pgHead</b>
     * <b>pgHead2</b> <b>staffGrp</b> MEI.usersymbols:
     * <b>symbolTable</b>
     *
     * Supported elements: <b>staffGrp</b>
     *
     * @param {Element} element the scoreDef element to process
     */
    processScoreDef_child : function (element) {
      var me = this;
      switch (element.localName) {
        case 'staffGrp' :
          me.processStaffGrp(element);
          break;
        case 'pgHead' :
          me.processPgHead(element);
          break;
        case 'pgFoot' :
          me.processPgFoot(element);
          break;
        default :
          Logger.info('Not supported', 'Element <' + element.localName +
                                       '> is not supported in <scoreDef>. Ignoring element.');
      }
    },

    processPgHead : function (element) {
      Logger.info('Not supported', 'Element <' + element.localName +
                                   '> is not supported in <scoreDef>. Ignoring element.');
    },

    processPgFoot : function (element) {
      Logger.info('Not supported', 'Element <' + element.localName +
                                   '> is not supported in <scoreDef>. Ignoring element.');
    },

    /**
     *
     * @param {Element} staffGrp
     * @param {Boolean} isChild specifies if the staffGrp is a child of another
     *            staffGrp (auto staff connectors only get attached
     *            to the outermost staffGrp elements)
     * @param {Object} ancestorSymbols
     * @return {Object} the range of the current staff group. Properties:
     *         first_n, last_n
     */
    processStaffGrp : function (staffGrp, isChild, ancestorSymbols) {
      var me = this, range = {}, isFirst = true, children, i, j, childRange;
      children = staffGrp.childNodes;
      for (i = 0, j = children.length; i < j; i++) {
        if (children[i].nodeType === 1) {
          childRange = me.processStaffGrp_child(staffGrp, children[i], ancestorSymbols);
          if (childRange) {
            Logger.debug('Converter.processStaffGrp() {1}.{a}', 'childRange.first_n: ' +
                                                                childRange.first_n, ' childRange.last_n: ' +
                                                                                    childRange.last_n);
            if (isFirst) range.first_n = childRange.first_n;
            range.last_n = childRange.last_n;
            isFirst = false;
          }
        }

      }
      me.setConnectorModels(staffGrp, range, isChild, ancestorSymbols);
      return range;
    },

    /**
     * MEI element <b>staffGrp</b> may contain (MEI v2.1.0): MEI.cmn: meterSig
     * meterSigGrp MEI.mensural: mensur proport MEI.midi: instrDef
     * MEI.shared: clef clefGrp keySig label layerDef
     *
     * Supported elements: <b>staffGrp</b> <b>staffDef</b>
     *
     * @param {Element} parent
     * @param {Element} element
     * @param {Object} ancestorSymbols
     * @return {Object} the range of staves. Properties: first_n, last_n
     */
    processStaffGrp_child : function (parent, element, ancestorSymbols) {
      var me = this, stave_n, myAncestorSymbols;
      switch (element.localName) {
        case 'staffDef' :
          stave_n = me.processStaffDef(element, me.scoreDefElement);
          return {
            first_n : stave_n,
            last_n : stave_n
          };
        case 'staffGrp' :
          myAncestorSymbols =
          (!ancestorSymbols) ? [parent.getAttribute('symbol')] : ancestorSymbols.concat(parent.getAttribute('symbol'));
          return me.processStaffGrp(element, true, myAncestorSymbols);
        default :
          Logger.info('Not supported', 'Element <' + element.localName +
                                       '> is not supported in <staffGrp>. Ignoring element.');
      }
    },

    /**
     * reads a staffDef, writes it to currentStaveInfos
     *
     * @param {Element} element
     * @param {Element} scoreDef
     * @return {Number} the staff number of the staffDef
     */
    processStaffDef : function (element, scoreDef) {
      var me = this, stave_n, staveInfo;
      stave_n = parseInt(element.getAttribute('n'), 10);
      if (!isNaN(stave_n)) {
        staveInfo = me.currentStaveInfos[stave_n];
        if (staveInfo) {
          staveInfo.updateDef(element, scoreDef);
        } else {
          me.currentStaveInfos[stave_n] = new StaveInfo(element, scoreDef, true, true, true);
        }
        return stave_n;
      } else {
        throw new RuntimeError(Util.serializeElement(element) + ' must have an @n attribute of type integer.');
      }
    }
  };
/*
 * StaveVoice.js Author: Zoltan Komives (zolaemil@gmail.com) Created:
 * 25.07.2013
 *
 * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



  /**
   * @class MEI2VF.StaveVoice
   * @private
   *
   * @constructor
   * @param {Object} voice
   * @param {Object} stave_n
   */
  var StaveVoice = function (voice, stave_n) {
    this.voice = voice;
    this.stave_n = stave_n;
  };
/*
 * StaveVoices.js Author: Zoltan Komives (zolaemil@gmail.com) Created:
 * 25.07.2013
 *
 * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/*
 * Contributor: Alexander Erhard
 */



    /**
     * @class MEI2VF.StaveVoices
     * Stores all voices in a given measure along with the respective staff id.
     * Passes all voices to Vex.Flow.Formatter and calls joinVoices, then draws
     * all voices.
     * @private
     *
     * @constructor
     */
    var StaveVoices = function () {
        this.all_voices = [];
        this.formatter = new VF.Formatter();
    };

    StaveVoices.prototype = {
        addStaffVoice: function (staveVoice) {
            this.all_voices.push(staveVoice);
        },

        addVoice: function (voice, stave_n) {
            this.addStaffVoice(new StaveVoice(voice, stave_n));
        },

        reset: function () {
            this.all_voices = [];
        },

        preFormat: function () {
            var me = this, all, stave_n, i, voice;
            all = me.all_voices;
            me.vexVoices = [];
            me.vexVoicesStaffWise = {};
            i = all.length;

            while (i--) {
                voice = all[i].voice;
                me.vexVoices.push(voice);
                stave_n = all[i].stave_n;
                if (me.vexVoicesStaffWise[stave_n]) {
                    me.vexVoicesStaffWise[stave_n].push(voice);
                } else {
                    me.vexVoicesStaffWise[stave_n] = [voice];
                }
            }

            me.formatter.preCalculateMinTotalWidth(me.vexVoices);
            return me.formatter.getMinTotalWidth();
        },

        /**
         * returns how much of the total tick count in the measure is actually used by the first voice
         * return {Number}
         */
        getFillFactor: function () {
            var voice = this.vexVoices[0], ticksUsed;
            ticksUsed = voice.getTicksUsed().numerator;
            return (ticksUsed === 0) ? 1 : ticksUsed / voice.getTotalTicks().numerator;
        },

        /**
         *
         * @param {Object} stave a staff in the current measure used to set
         * the x dimensions of the voice
         */
        format: function (stave) {
            var me = this, i, f, alignRests;
            f = me.formatter;
            for (i in me.vexVoicesStaffWise) {
                alignRests = (me.vexVoicesStaffWise[i].length > 1);
                //alignRests=false;
                f.joinVoices(me.vexVoicesStaffWise[i]);
                if (alignRests) {
                    var voicesInStave = me.vexVoicesStaffWise[i];
                    for (var j = 0; j < voicesInStave.length; j++) {
                        me.alignRestsToNotes(voicesInStave[j].tickables, true, true);
                    }
                }
            }

            var justifyWidth = stave.getNoteEndX() - stave.getNoteStartX() - 10;
            f.createTickContexts(me.vexVoices);
            f.preFormat(justifyWidth, stave.getContext(), me.vexVoices, null);
        },

        // TODO make dependend on clashes with notes etc

        // from VF's formatter, modified
        alignRestsToNotes: function (notes, align_all_notes, align_tuplets) {

            var lookAhead = function (notes, rest_line, i, compare) {
                // If no valid next note group, next_rest_line is same as current.
                var next_rest_line = rest_line;

                // Get the rest line for next valid non-rest note group.
                i++;
                while (i < notes.length) {
                    if (!notes[i].isRest() && !notes[i].shouldIgnoreTicks()) {
                        next_rest_line = notes[i].getLineForRest();
                        break;
                    }
                    i++;
                }
            };

            for (var i = 0; i < notes.length; ++i) {

                // ADDED CONDITION && !notes[i].manualPosition
                if (notes[i] instanceof Vex.Flow.StaveNote && notes[i].isRest()
                    && !notes[i].manualPosition) {
                    var note = notes[i];

                    if (note.tuplet && !align_tuplets) continue;

                    // If activated rests not on default can be rendered as specified.
                    var position = note.getGlyph().position.toUpperCase();
                    if (position != "R/4" && position != "B/4") {
                        continue;
                    }

                    if (align_all_notes || note.beam != null) {
                        // Align rests with previous/next notes.
                        var props = note.getKeyProps()[0];
                        if (i === 0) {
                            props.line = lookAhead(notes, props.line, i, false);
                            note.setKeyLine(0, props.line);
                        } else if (i > 0 && i < notes.length) {
                            // If previous note is a rest, use its line number.
                            var rest_line;
                            if (notes[i - 1].isRest()) {
                                rest_line = notes[i - 1].getKeyProps()[0].line;
                                props.line = rest_line;
                            } else {
                                rest_line = notes[i - 1].getLineForRest();
                                // Get the rest line for next valid non-rest note group.
                                props.line = lookAhead(notes, rest_line, i, true);
                            }
                            note.setKeyLine(0, props.line);
                        }
                    }
                }
            }

        },

        //    getStaveLowestY : function (stave_n) {
        //      var me=this, i, j, voices, lowestY = 0;
        //      voices = me.vexVoicesStaffWise[stave_n];
        //      if (voices) {
        //        console.log(voices);
        //        for (i=0,j=voices.length;i<j;i++) {
        //          lowestY = Math.max(lowestY, voices[i].boundingBox.y + voices[i].boundingBox.h);
        //        }
        //        return lowestY;
        //      }
        //    },

        // TODO: also use this for auto y formatting!!

        getYBounds: function () {
            var me = this, vStaveWise = me.vexVoicesStaffWise;
            var yBounds = {};
            for (var i in vStaveWise) {
                yBounds[i] = [];
                for (var k = 0, l = vStaveWise[i].length; k < l; k++) {
                    yBounds[i].push(vStaveWise[i][k].getBoundingBox());
                }
            }
            return yBounds;
        },


        draw: function (context) {
            var i, staveVoice, all_voices = this.all_voices;
            for (i = 0; i < all_voices.length; ++i) {
                staveVoice = all_voices[i];

                this.drawVoice.call(staveVoice.voice, context);
                //        staveVoice.voice.draw(context, staves[staveVoice.stave_n]);
            }
        },

        // modified version of VF.Voice.draw() which calls setStave with the voice's stave as parameter
        drawVoice: function (context) {
            var boundingBox = null;
            for (var i = 0; i < this.tickables.length; ++i) {
                var tickable = this.tickables[i];

                if (!tickable.getStave()) {
                    throw new Vex.RuntimeError("MissingStave", "The voice cannot draw tickables without staves.");
                }

                tickable.setStave(tickable.getStave());

                if (i === 0) boundingBox = tickable.getBoundingBox();

                if (i > 0 && boundingBox) {
                    var tickable_bb = tickable.getBoundingBox();
                    if (tickable_bb) boundingBox.mergeWith(tickable_bb);
                }

                tickable.setContext(context);
                tickable.draw();
            }

            this.boundingBox = boundingBox;
        }


    };
/*
 * MEItoVexFlow, Converter class
 * (based on meitovexflow.js)
 * Rearrangements and additions: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/*
 * MEItoVexFlow
 *
 * Author: Richard Lewis Contributors: Zoltan Komives, Raffaele Viglianti
 *
 * See README for details of this library
 *
 * Copyright © 2012, 2013 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



  /**
   * Converts an MEI XML document / document fragment to VexFlow objects and
   * optionally renders it using SVG, Raphael or HTML5 Canvas.
   *
   * Usage:
   *
   * - Either pass a config object to the constructor function or (if no config
   * object has been passed) call {@link #initConfig} after construction.
   * - Call {@link #process} to process an MEI XML document
   * - Call {@link #draw} to draw the processed VexFlow objects to a canvas
   *
   * @class MEI2VF.Converter
   *
   * @constructor
   * @param {Object} [config]
   * @chainable
   * @return {MEI2VF.Converter} this
   */
  var Converter = function (config) {
    if (config) {
      this.initConfig(config);
    }
    return this;
  };

  Converter.prototype = {

    defaults : {
      /**
       * @cfg {Number|null} pageWidth The width of the page. If null, the page width is calculated on
       * basis of the page content
       */
      pageWidth : null, /**
       * @cfg {Number} pageTopMar The page top margin
       */
      pageTopMar : 60, /**
       * @cfg {Number} pageBottomMar The page bottom margin
       */
      pageBottomMar : 80, /**
       * @cfg {Number} pageLeftMar The page left margin
       */
      pageLeftMar : 20, /**
       * @cfg {Number} pageRightMar The page right margin
       */
      pageRightMar : 20, /**
       * @cfg {Number} defaultSpacingInMeasure The default spacing added to a measure's minimum
       * width when no page width is specified (i.e. when the width cannot be determined on basis
       * of the page width)
       */
      defaultSpacingInMeasure : 180, /**
       * @cfg {Number} systemSpacing The default spacing between two stave
       * systems
       */
      systemSpacing : 90, /**
       * @cfg {Number} staveSpacing The default spacing between two staves
       * within a system; overridden by the spacing attribute of a staffDef
       * element in the MEI code
       */
      staveSpacing : 60, /**
       * @cfg {Boolean} autoStaveConnectorLine Specifies if a stave connector
       * line is drawn on the left of systems by default; if set to true, the
       * auto line will not appear when staffDef/@symbol="none" is set for the
       * outermost staffDef element
       */
      autoStaveConnectorLine : true, /**
       * @cfg {"full"/"abbr"/null} labelMode Specifies the way voice labels are
       * added
       * to staves. Values:
       *
       * - 'full': renders full labels in the first system, abbreviated labels
       * in all following systems
       * - 'abbr': only render abbreviated labels
       * - null or undefined: renders no labels
       */
      labelMode : null, // 'full',
      readMeasureWidths : true, // false
      processSb : 'sb', // sb / ignore
      processPb : 'sb', // pb / sb / ignore
      /**
       * @cfg {Number} maxHyphenDistance The maximum distance (in pixels)
       * between two hyphens in the lyrics lines
       */
      maxHyphenDistance : 75, /**
       * @cfg {Object} lyricsFont The font used for rendering lyrics (and
       * hyphens)
       * @cfg {String} lyricsFont.family the font family
       * @cfg {Number} lyricsFont.size the font size
       */
      lyricsFont : {
        family : 'Times', size : 15, spacing : 1.3
      }, /**
       * @cfg {Object} annotFont the font used for annotations (for example,
       * 'pizz.')
       * @cfg {String} annotFont.family the font family
       * @cfg {Number} annotFont.size the font size
       */
      annotFont : {
        family : 'Times', size : 15
      }, /**
       * @cfg {Object} dynamFont the font used for dynamics
       * @cfg {String} dynamFont.family the font family
       * @cfg {Number} dynamFont.size the font size
       * @cfg {String} dynamFont.weight the font weight
       */
      dynamFont : {
        family : 'Times', size : 17.5, weight : 'bold italic'
      }, /**
       * @cfg {Object} tempoFont The tempo font
       * @cfg {String} tempoFont.family the font family
       * @cfg {Number} tempoFont.size the font size
       * @cfg {String} tempoFont.weight the font weight
       */
      tempoFont : {
        family : "Times", size : 17, weight : "bold"
      }
    },

    /**
     * initializes the Converter
     * @method initConfig
     * @param {Object} config A config object (optional)
     * @chainable
     * @return {Converter} this
     */
    initConfig : function (config) {
      var me = this;
      me.cfg = Util.extend({}, me.defaults, config);
      /**
       * an instance of MEI2VF.SystemInfo dealing with the system and stave
       * info derived from the MEI data
       * @property {MEI2VF.SystemInfo} systemInfo
       */
      me.systemInfo = new SystemInfo();

      me.pageInfo = new PageInfo(me.cfg);

      switch (me.cfg.processSb) {
        case 'pb' :
          me.onSb = me.setPendingPageBreak;
          break;
        case 'sb' :
          me.onSb = me.setPendingSystemBreak;
          break;
        default :
          me.onSb = me.emptyFn;
      }
      switch (me.cfg.processPb) {
        case 'pb' :
          me.onPb = me.setPendingPageBreak;
          break;
        case 'sb' :
          me.onPb = me.setPendingSystemBreak;
          break;
        default :
          me.onPb = me.emptyFn;
      }
      return me;

    },

    emptyFn : function () {
    },

    /**
     * Resets all data. Called by {@link #process}.
     * @method reset
     * @chainable
     * @return {Converter} this
     */
    reset : function () {
      var me = this;

      me.page = new Page();

      me.systemInfo.init(me.cfg);
      /**
       * @property {MEI2VF.EventLink[][]} unresolvedTStamp2
       */
      me.unresolvedTStamp2 = [];
      /**
       * Contains all Vex.Flow.Stave objects. Addressing scheme:
       * [measure_n][stave_n]
       * @property {Vex.Flow.Stave[][]} allVexMeasureStaves
       */
      me.allVexMeasureStaves = [];

      me.beams = new BeamCollection();
      me.tuplets = new TupletCollection();

      /**
       * an instance of MEI2VF.Dynamics dealing with and storing all dynamics
       * found in the MEI document
       * @property {MEI2VF.Dynamics} dynamics
       */
      me.dynamics = new Dynamics(me.systemInfo, me.cfg.dynamFont);
      /**
       * an instance of MEI2VF.Arpeggios dealing with and storing all
       * arpeggios found in the MEI document
       * @property {Arpeggios} arpeggios
       */
      me.arpeggios = new Arpeggios(me.systemInfo);
      /**
       * an instance of MEI2VF.Directives dealing with and storing all
       * directives found in the MEI document
       * @property {MEI2VF.Directives} directives
       */
      me.directives = new Directives(me.systemInfo, me.cfg.annotFont);
      /**
       * an instance of MEI2VF.Fermatas dealing with and storing all
       * fermata elements found in the MEI document (fermata attributes are
       * attached directly to the containing note-like object)
       * @property {MEI2VF.Fermatas} fermatas
       */
      me.fermatas = new Fermatas(me.systemInfo);
      /**
       * an instance of MEI2VF.Ornaments dealing with and storing all
       * ornament elements found in the MEI document
       * @property {MEI2VF.Ornaments} ornaments
       */
      me.ornaments = new Ornaments(me.systemInfo);
      /**
       * an instance of MEI2VF.Ties dealing with and storing all ties found in
       * the MEI document
       * @property {MEI2VF.Ties} ties
       */
      me.ties = new Ties(me.systemInfo, me.unresolvedTStamp2);
      /**
       * an instance of MEI2VF.Slurs dealing with and storing all slurs found in
       * the MEI document
       * @property {MEI2VF.Slurs} slurs
       */
      me.slurs = new Slurs(me.systemInfo, me.unresolvedTStamp2);
      /**
       * an instance of MEI2VF.Hairpins dealing with and storing all hairpins
       * found in the MEI document
       * @property {MEI2VF.Hairpins} hairpins
       */
      me.hairpins = new Hairpins(me.systemInfo, me.unresolvedTStamp2);
      /**
       * contains all note-like objects in the current MEI document, accessible
       * by their xml:id
       * @property {Object} notes_by_id
       * @property {Element} notes_by_id.meiNote the XML Element of the note
       * @property {Vex.Flow.StaveNote} notes_by_id.vexNote the VexFlow note
       * object
       */
      me.notes_by_id = {};
      /**
       * the number of the current system
       * @property {Number} currentSystem_n
       */
      me.currentSystem_n = -1;
      /**
       * indicates if a system break is currently to be processed
       * @property {Boolean} pendingSystemBreak
       */
      me.pendingSystemBreak = false;
      /**
       * indicates if a system break is currently to be processed
       * @property {Boolean} pendingSectionBreak
       */
      me.pendingSectionBreak = true;
      /**
       * Contains information about the volta type of the current stave. Properties:
       *
       * -  `start` {String} indicates the number to render to the volta. When
       * falsy, it is assumed that the volta does not start in the current
       * measure
       * -  `end` {Boolean} indicates if there is a volta end in the current
       * measure
       *
       * If null, no volta is rendered
       * @property {Object} voltaInfo
       */
      me.voltaInfo = null;
      return me;
    },

    /**
     * Processes the specified MEI document or
     * document fragment. The generated objects can
     * be processed further or drawn immediately to a canvas via {@link #draw}.
     * @method process
     * @chainable
     * @param {XMLDocument|Element} xmlDoc an XML document or element containing the MEI music to render
     * @return {Converter} this
     */
    process : function (xmlDoc) {
      var me = this;

      //      me.systemInfo.processScoreDef(xmlDoc.getElementsByTagName('scoreDef')[0]);
      //      me.processSections(xmlDoc);

      if (xmlDoc.localName === 'score') {
        me.processScoreChildren(xmlDoc);
      } else {
        me.processScoreChildren(xmlDoc.querySelector('score'));
      }

      me.arpeggios.createVexFromInfos(me.notes_by_id);
      me.dynamics.createVexFromInfos(me.notes_by_id);
      me.ornaments.createVexFromInfos(me.notes_by_id);
      me.directives.createVexFromInfos(me.notes_by_id);
      me.fermatas.createVexFromInfos(me.notes_by_id);
      me.ties.createVexFromInfos(me.notes_by_id);
      me.slurs.createVexFromInfos(me.notes_by_id);
      me.hairpins.createVexFromInfos(me.notes_by_id);

      me.tuplets.resolveSpanElements(me.notes_by_id);
      me.beams.resolveSpanElements(me.notes_by_id);

      return me;
    },

    format : function (ctx) {
      var me = this;
      me.page.formatSystems(me.pageInfo, me.systemInfo, me.cfg, ctx);
      me.beams.postFormat();
    },

    /**
     * Draws the internal data objects to a canvas
     * @method draw
     * @chainable
     * @param ctx The canvas context
     * @return {Converter} this
     */
    draw : function (ctx) {
      var me = this;
      me.page.setContext(ctx).drawSystems();
      me.beams.setContext(ctx).draw();
      me.tuplets.setContext(ctx).draw();
      me.ties.setContext(ctx).draw();
      me.slurs.setContext(ctx).draw();
      me.hairpins.setContext(ctx).draw();
      return me;
    },

    /**
     * Returns the width and the height of the area that contains all drawn
     * staves as per the last processing.
     *
     * @method getStaveArea
     * @return {Object} the width and height of the area that contains all
     * staves.
     * Properties: width, height
     */
    getStaveArea : function () {
      var height;
      height = this.systemInfo.getCurrentLowestY();
      var allVexMeasureStaves = this.getAllVexMeasureStaves();
      var i, k, max_start_x, area_width, stave;
      i = allVexMeasureStaves.length;
      area_width = 0;
      while (i--) {
        if (allVexMeasureStaves[i]) {
          max_start_x = 0;
          // get maximum start_x of all staves in measure
          k = allVexMeasureStaves[i].length;
          while (k--) {
            stave = allVexMeasureStaves[i][k];
            if (stave) {
              max_start_x = Math.max(max_start_x, stave.getNoteStartX());
            }
          }
          k = allVexMeasureStaves[i].length;
          while (k--) {
            // get maximum width of all staves in measure
            stave = allVexMeasureStaves[i][k];
            if (stave) {
              area_width = Math.max(area_width, max_start_x + stave.getWidth());
            }
          }
        }
      }
      return {
        width : area_width, height : height
      };
    },

    /**
     * returns a 2d array of all Vex.Flow.Stave objects, arranged by
     * [measure_n][stave_n]
     * @method getAllVexMeasureStaves
     * @return {Vex.Flow.Stave[][]} see {@link #allVexMeasureStaves}
     */
    getAllVexMeasureStaves : function () {
      return this.allVexMeasureStaves;
    },

    /**
     * returns all systems created when processing the MEI document
     * @method getSystems
     * @return {MEI2VF.System[]}
     */
    getSystems : function () {
      return this.page.getSystems();
    },

    /**
     * returns all note-like objects created when processing the MEI document
     * @method getNotes
     * @return {Object} for the object properties, see {@link #notes_by_id}
     */
    getNotes : function () {
      return this.notes_by_id;
    },

    /**
     * creates in initializes a new {@link MEI2VF.System} and updates the stave
     * modifier infos
     * @method createNewSystem
     */
    createNewSystem : function () {
      var me = this, system;

      Logger.debug('Converter.createNewSystem()', '{enter}');

      me.pendingSystemBreak = false;
      me.currentSystem_n += 1;

      system = new System(me.pageInfo, me.systemInfo, me.currentSystem_n);

      if (me.pendingSectionBreak) {
        me.pendingSectionBreak = false;
        me.systemInfo.forceSectionStartInfos();
      } else {
        me.systemInfo.forceStaveStartInfos();
      }

      me.page.addSystem(system, me.currentSystem_n);
      return system;
    },

    processScoreChildren : function (score) {
      var me = this, i, j, childNodes, sectionContext;

      sectionContext = {
        voltaInfo : null
      };

      if (score) {
        childNodes = score.childNodes;
        for (i = 0, j = childNodes.length; i < j; i++) {
          if (childNodes[i].nodeType === 1) {
            me.processScoreChild(childNodes[i], sectionContext);
          }
        }
      } else {
        throw new RuntimeError('No score element found in the document.')
      }
    },

    processScoreChild : function (element, sectionContext) {
      var me = this;
      switch (element.localName) {
        case 'scoreDef' :
          me.systemInfo.processScoreDef(element);
          break;
        case 'staffDef' :
          me.systemInfo.processStaffDef(element, null);
          break;
        case 'pb' :
          me.onPb(element);
          break;
        case 'ending' :
          me.processEnding(element, sectionContext);
          break;
        case 'section' :
          me.processSection(element, sectionContext);
          break;
        default :
          Logger.info('Not supported', 'Element ' + Util.serializeElement(element) +
                                       ' is not supported in <score>. Ignoring element.');
      }
    },

    //    /**
    //     * @method processSections
    //     */
    //    processSections : function (xmlDoc) {
    //      var me = this, i, j, sections;
    //      sections = xmlDoc.getElementsByTagName('section');
    //      for (i = 0, j = sections.length; i < j; i++) {
    //        me.processSection(sections[i]);
    //      }
    //    },

    /**
     *@method processSection
     */
    processSection : function (element, sectionContext) {
      var me = this, i, j, sectionChildren = element.childNodes;
      for (i = 0, j = sectionChildren.length; i < j; i += 1) {
        if (sectionChildren[i].nodeType === 1) {
          me.processSectionChild(sectionChildren[i], sectionContext);
        }
      }
    },

    /**
     * @method processEnding
     */
    processEnding : function (element, sectionContext) {
      var me = this, next, childNode, voltaInfo, endVoltaHere;

      voltaInfo = sectionContext.voltaInfo;

      endVoltaHere = (voltaInfo === null);

      var getNext = function (node) {
        var nextSibling = node.nextSibling;
        while (nextSibling && nextSibling.nodeType !== 1) {
          nextSibling = nextSibling.nextSibling;
        }
        return nextSibling;
      };

      childNode = element.firstChild;
      if (childNode.nodeType !== 1) {
        childNode = getNext(childNode);
      }

      // TODO take into account that section children may be other elements than measures;
      // in this case, the last measure wouldn't be the last child element in the list!!

      while (childNode) {
        next = getNext(childNode);
        // modify volta information only on measure elements
        if (childNode.localName === 'measure') {
          if (sectionContext.voltaInfo === null) {
            sectionContext.voltaInfo = {
              start : element.getAttribute('n')
            };
          } else {
            delete sectionContext.voltaInfo.start;
          }
          if (!next && endVoltaHere) {
            sectionContext.voltaInfo.end = true;
          }
        } else if (childNode.localName === 'ending' || childNode.localName === 'section') {
          Logger.info('Not supported', Util.serializeElement(childNode) + ' is not supported as a child of ' +
                                       Util.serializeElement(element) + '. Trying to process it anyway.');
        }
        me.processSectionChild(childNode, sectionContext);
        childNode = next;
      }
      if (endVoltaHere) sectionContext.voltaInfo = null;
    },

    /**
     * MEI element <b>section</b> may contain (MEI v2.1.0): MEI.cmn: measure
     * MEI.critapp: app MEI.edittrans: add choice corr damage del gap
     * handShift orig reg restore sic subst supplied unclear MEI.shared:
     * annot ending expansion pb sb scoreDef section staff staffDef
     * MEI.text: div MEI.usersymbols: anchoredText curve line symbol
     *
     * Supported elements: <b>ending</b> <b>measure</b> <b>scoreDef</b> <b>section</b> <b>staffDef</b>
     * <b>sb</b>
     * @method processSectionChild
     */
    processSectionChild : function (element, sectionContext) {
      var me = this;
      switch (element.localName) {
        case 'measure' :
          me.processMeasure(element, sectionContext);
          break;
        case 'scoreDef' :
          me.systemInfo.processScoreDef(element);
          break;
        case 'staffDef' :
          me.systemInfo.processStaffDef(element, null);
          break;
        case 'pb' :
          me.onPb(element);
          break;
        case 'sb' :
          me.onSb(element);
          break;
        case 'ending' :
          me.processEnding(element, sectionContext);
          break;
        case 'section' :
          me.processSection(element, sectionContext);
          break;
        default :
          Logger.info('Not supported', 'Element ' + Util.serializeElement(element) +
                                       ' is not supported in <section>. Ignoring element.');
      }
    },

    setPendingPageBreak : function () {
      Logger.info('setPendingPageBreak() not implemented.')
    },

    /**
     * sets the property {@link #pendingSystemBreak} to `true`. When true, a
     * new system will be initialized when {@link #processMeasure} is called
     * the next time.
     * @method setPendingSystemBreak
     */
    setPendingSystemBreak : function () {
      this.pendingSystemBreak = true;
    },

    /**
     * Processes a MEI measure element
     * @method processMeasure
     * @param {Element} element the MEI measure element
     * @param {Object} sectionContext the context shared by the current elements
     */
    processMeasure : function (element, sectionContext) {
      var me = this, atSystemStart, systems, system, system_n, childNodes;

      if (me.pendingSectionBreak || me.pendingSystemBreak) {
        system = me.createNewSystem();
        atSystemStart = true;
      } else {
        systems = me.page.getSystems();
        system_n = systems.length - 1;
        system = systems[system_n];
        atSystemStart = false;
      }

      Logger.debug('Converter.processMeasure()', '{enter}');

      var barlineInfo = {
        leftBarline : element.getAttribute('left'), rightBarline : element.getAttribute('right')
      };


      // VexFlow doesn't support repetition starts at the end of staves -> pass
      // the value of @right to the following measure if @left isn't specified in it
      if (sectionContext.leftBarlineElement && !barlineInfo.leftBarline) {
        barlineInfo.leftBarline = sectionContext.leftBarlineElement.getAttribute('right');
        barlineInfo.leftBarlineElement = sectionContext.leftBarlineElement;
        sectionContext.leftBarlineElement = null;
      }
      if (barlineInfo.rightBarline === 'rptstart') {
        barlineInfo.rightBarline = null;
        sectionContext.leftBarlineElement = element;
      }


      var staveElements = [], arpegElements = [], dirElements = [], slurElements = [], tieElements = [], hairpinElements = [], tempoElements = [], dynamElements = [], fermataElements = [], rehElements = [], ornamentElements = [], i, j;

      childNodes = element.childNodes;
      for (i = 0, j = childNodes.length; i < j; i++) {
        switch (childNodes[i].localName) {
          // skip text nodes
          case null :
            break;
          case 'staff':
            staveElements.push(childNodes[i]);
            break;
          case 'dir':
            dirElements.push(childNodes[i]);
            break;
          case 'harm':
            dirElements.push(childNodes[i]);
            break;
          case 'tie':
            tieElements.push(childNodes[i]);
            break;
          case 'slur':
            slurElements.push(childNodes[i]);
            break;
          case 'hairpin':
            hairpinElements.push(childNodes[i]);
            break;
          case 'tempo':
            tempoElements.push(childNodes[i]);
            break;
          case 'dynam':
            dynamElements.push(childNodes[i]);
            break;
          case 'arpeg':
            arpegElements.push(childNodes[i]);
            break;
          case 'fermata':
            fermataElements.push(childNodes[i]);
            break;
          case 'mordent':
          case 'turn':
          case 'trill':
            ornamentElements.push(childNodes[i]);
            break;
          case 'reh':
            rehElements.push(childNodes[i]);
            break;
          case 'beamSpan':
            me.beams.addSpanElements(childNodes[i]);
            break;
          case 'tupletSpan':
            me.tuplets.addSpanElements(childNodes[i]);
            break;
          default:
            Logger.info('Not supported', '<' + childNodes[i].localName + '> is not supported as child of <measure>.');
            break;
        }
      }

      // the stave objects will be stored in two places:
      // 1) in each MEI2VF.Measure
      // 2) in MEI2VF.Converter.allVexMeasureStaves
      var staves = me.initializeStavesInMeasure(system, staveElements, barlineInfo, atSystemStart, sectionContext);
      var measureIndex = me.allVexMeasureStaves.push(staves) - 1;

      var currentStaveVoices = new StaveVoices();

      var eventContext = new EventContext(me.notes_by_id, me.currentSystem_n);

      for (i = 0, j = staveElements.length; i < j; i++) {
        me.processStaveEvents(staves, staveElements[i], measureIndex, currentStaveVoices, eventContext);
      }

      if (eventContext.clefCheckQueue.length !== 0) {
        me.processClefCheckQueue(eventContext);
      }

      me.dynamics.createInfos(dynamElements, element);
      me.arpeggios.createInfos(arpegElements, element);
      me.directives.createInfos(dirElements, element);
      me.fermatas.createInfos(fermataElements, element);
      me.ornaments.createInfos(ornamentElements, element);
      me.ties.createInfos(tieElements, element, measureIndex, me.systemInfo);
      me.slurs.createInfos(slurElements, element, measureIndex, me.systemInfo);
      me.hairpins.createInfos(hairpinElements, element, measureIndex, me.systemInfo);

      var measure = new Measure({
        system : system,
		n : element.getAttribute('n'),
        element : element,
        staves : staves,
        voices : currentStaveVoices,
        startConnectorCfg : (atSystemStart) ? {
          labelMode : me.cfg.labelMode,
          models : me.systemInfo.startConnectorInfos,
          staves : staves,
          system_n : me.currentSystem_n
        } : null,
        inlineConnectorCfg : {
          models : me.systemInfo.inlineConnectorInfos,
		  staves : staves,
		  barlineInfo : barlineInfo
        },
        tempoElements : tempoElements,
        rehElements : rehElements,
        tempoFont : me.cfg.tempoFont,
        readMeasureWidths : me.cfg.readMeasureWidths
      });

      system.addMeasure(measure);
    },

    processClefCheckQueue : function (eventContext) {


      var i, j, event, events = eventContext.clefCheckQueue;
      for (i = 0, j = events.length; i < j; i++) {
        event = events[i];
        if (event.clef !== event.stave.clef) {

          // TODO check if there is a clef change in any of the voices in the other system
          // and adjust accordingly determine the position
          event.clef = event.stave.clef;

          //          console.log(event.clef);
          //          console.log(event.stave.clef);

          event.keyProps = [];
          event.calculateKeyProps();
          event.buildNoteHeads();
          event.buildStem();
        }
      }

      eventContext.emptyClefCheckQueue();

    },


    /**
     * @method initializeStavesInMeasure
     * @param {System} system the current system
     * @param {Element[]} staveElements all stave elements in the current
     * measure
     * @param {Object} barlineInfo information about the barlines to render to the measure
     * @param {Boolean} atSystemStart indicates if the current measure is the system's start measure
     * @param {Object} sectionContext an object containing section child context information
     */
    initializeStavesInMeasure : function (system, staveElements, barlineInfo, atSystemStart, sectionContext) {
      var me = this, i, j, stave, stave_n, staves, isFirstStaveInMeasure = true, clefOffsets = {}, maxClefOffset = 0, keySigOffsets = {}, maxKeySigOffset = 0, precedingMeasureStaves, newClef, currentStaveInfo, padding;

      staves = [];

      if (!atSystemStart) {
        precedingMeasureStaves = system.getLastMeasure().getStaves();
      }

      // first run: create MEI2VF.Stave objects, store them in the staves
      // array. Set stave barlines and stave volta. Add clef. Get each stave's
      // clefOffset and calculate the maxClefOffset.
      for (i = 0, j = staveElements.length; i < j; i++) {
        stave_n = parseInt(staveElements[i].getAttribute('n'), 10);
        if (isNaN(stave_n)) {
          throw new RuntimeError(Util.serializeElement(staveElements[i]) +
                                 ' must have an @n attribute of type integer.');
        }

        stave = new Stave({
          system : system, y : system.getStaveYs()[stave_n], barlineInfo : barlineInfo
        });
        staves[stave_n] = stave;

        if (isFirstStaveInMeasure && sectionContext.voltaInfo) {
          stave.addVoltaFromInfo(sectionContext.voltaInfo);
          isFirstStaveInMeasure = false;
        }

        if (precedingMeasureStaves && precedingMeasureStaves[stave_n]) {
          currentStaveInfo = me.systemInfo.getStaveInfo(stave_n);
          newClef = currentStaveInfo.getClef();
          if (currentStaveInfo.showClefCheck()) {
            precedingMeasureStaves[stave_n].addEndClefFromInfo(newClef);
          }
          stave.clef = newClef.type;
          clefOffsets[stave_n] = 0;
          maxClefOffset = 0;
        } else {
          currentStaveInfo = me.systemInfo.getStaveInfo(stave_n);
          if (!currentStaveInfo) {
            throw new RuntimeError(Util.serializeElement(staveElements[i]) + ' refers to stave "' + stave_n +
                                   '", but no corresponding stave definition could be found in the document.');
          }
          if (currentStaveInfo.showClefCheck()) {
            stave.addClefFromInfo(currentStaveInfo.getClef());
          }
          clefOffsets[stave_n] = stave.getModifierXShift();
          maxClefOffset = Math.max(maxClefOffset, clefOffsets[stave_n]);
        }
      }

      // second run: add key signatures; if the clefOffset of a stave is less than
      // maxClefOffset, add padding to the left of the key signature. Get each
      // stave's keySigOffset and calculate the maxKeySigOffset.
      j = staves.length;
      for (i = 0; i < j; i++) {
        stave = staves[i];
        if (stave) {
          if (clefOffsets[i] !== maxClefOffset) {
            padding = maxClefOffset - clefOffsets[i] + 10;
          } else {
            padding = null;
          }
          currentStaveInfo = me.systemInfo.getStaveInfo(i);
          if (currentStaveInfo.showKeysigCheck()) {
            stave.addKeySpecFromInfo(currentStaveInfo.getKeySpec(), padding);
          }
          keySigOffsets[i] = stave.getModifierXShift();
          maxKeySigOffset = Math.max(maxKeySigOffset, keySigOffsets[i]);
        }
      }

      // third run: add time signatures; if the keySigOffset of a stave is
      // less than maxKeySigOffset, add padding to the left of the time signature.
      for (i = 0; i < j; i++) {
        stave = staves[i];
        if (stave) {
          if (keySigOffsets[i] !== maxKeySigOffset) {
            padding = maxKeySigOffset - keySigOffsets[i] + 15;
          } else {
            padding = null;
          }
          currentStaveInfo = me.systemInfo.getStaveInfo(i);
          if (currentStaveInfo.showTimesigCheck()) {
            stave.addTimeSpecFromInfo(currentStaveInfo.getTimeSpec(), padding);
          }
        }
      }

      return staves;
    },

    /**
     * Processes a single stave in a measure
     *
     * @method processStaveEvents
     * @param {Vex.Flow.Stave[]} staves the stave objects in the current
     * measure
     * @param {Element} staveElement the MEI staff element
     * @param {Number} measureIndex the index of the current measure
     * @param {MEI2VF.StaveVoices} currentStaveVoices The current StaveVoices
     * object
     * @param {EventContext} eventContext the context shared by the current events
     */
    processStaveEvents : function (staves, staveElement, measureIndex, currentStaveVoices, eventContext) {
      var me = this, stave, stave_n, layerElements, i, j, vexNotes, staveInfo;

      stave_n = parseInt(staveElement.getAttribute('n'), 10) || 1;
      stave = staves[stave_n];

      eventContext.startNewStave(stave, stave_n);

      staveInfo = me.systemInfo.getStaveInfo(stave_n);
      var meter = staveInfo.getTimeSpec();

      layerElements = staveElement.getElementsByTagName('layer');

      for (i = 0, j = layerElements.length; i < j; i++) {
        eventContext.setLayerDir((j > 1) ?
                                 (i === 0 ? VF.StaveNote.STEM_UP : i === j - 1 ? VF.StaveNote.STEM_DOWN : null) : null);
        me.resolveUnresolvedTimestamps(layerElements[i], stave_n, measureIndex, meter);
        staveInfo.checkInitialClef();

        vexNotes = me.processNoteLikeChildren(eventContext, layerElements[i], staveInfo);
        currentStaveVoices.addVoice(me.createVexVoice(vexNotes, meter), stave_n);
      }

            var anchoredTexts = staveElement.getElementsByTagName('anchoredText');
            for (i = 0, j = anchoredTexts.length; i < j; i++) {
                me.processAnchoredText(eventContext, anchoredTexts[i]);
            }

      // if there is a clef not yet attached to a note (i.e. the last clef), add it as a stave end modifier
      if (eventContext.clefChangeInfo) {
        stave.addEndClefFromInfo(eventContext.clefChangeInfo);
        eventContext.setClefChangeInfo(null);
      }

      staveInfo.finalizeClefInfo();

    },

    /**
     * Creates a new Vex.Flow.Voice
     * @method createVexVoice
     * @param {Array} voiceContents The contents of the voice, an array of
     * tickables
     * @param {Object} meter The meter of the enclosing staff element
     * return {Vex.Flow.Voice}
     */
    createVexVoice : function (voiceContents, meter) {
      var me = this, voice;
      if (!Array.isArray(voiceContents)) {
        throw new RuntimeError('me.createVexVoice() voice_contents argument must be an array.');
      }
      voice = new VF.Voice({
        num_beats : meter.count, beat_value : meter.unit, resolution : VF.RESOLUTION
      });
      voice.setStrict(false);
      voice.addTickables(voiceContents);
      return voice;
    },

    /**
     * @method resolveUnresolvedTimestamps
     */
    resolveUnresolvedTimestamps : function (layer, stave_n, measureIndex, meter) {
      var me = this, refLocationIndex, i, j, unresolvedTStamp2;
      // check if there's an unresolved TStamp2 reference to this location
      // (measure, staff, layer):
      stave_n = stave_n || 1;
      refLocationIndex = measureIndex + ':' + stave_n + ':' + (parseInt(layer.getAttribute('n'), 10) || '1');
      unresolvedTStamp2 = me.unresolvedTStamp2[refLocationIndex];
      if (unresolvedTStamp2) {
        for (i = 0, j = unresolvedTStamp2.length; i < j; i++) {
          unresolvedTStamp2[i].setContext({
            layer : layer, meter : meter
          });
          // TODO: remove eventLink from the list
          unresolvedTStamp2[i] = null;
        }
        // at this point all references should be supplied with context.
        me.unresolvedTStamp2[refLocationIndex] = null;
      }
    },

    processNoteLikeChildren : function (eventContext, element, staveInfo) {
      var me = this, vexNotes = [], k, l, processingResults;

      var childElements = element.childNodes;
      for (k = 0, l = childElements.length; k < l; k++) {
        if (childElements[k].nodeType === 1) {
          processingResults = me.processNoteLikeElement(eventContext, childElements[k], staveInfo);
          if (processingResults) {
            if (Array.isArray(processingResults)) {
              vexNotes = vexNotes.concat(processingResults);
            } else {
              vexNotes.push(processingResults);
            }
          }
        }
      }
      return vexNotes;
    },

    /**
     * processes a note-like element by calling the adequate processing
     * function
     *
     * @method processNoteLikeElement
     * @param {Object} eventContext the layer context object
     * @param {Element} element the MEI element
     * @param {StaveInfo} staveInfo
     */
    processNoteLikeElement : function (eventContext, element, staveInfo) {
      var me = this;
      switch (element.localName) {
        case 'rest' :
          return me.processRest(eventContext, element, staveInfo);
        case 'mRest' :
          return me.processMRest(eventContext, element, staveInfo);
        case 'space' :
          return me.processSpace(eventContext, element);
        case 'note' :
          return me.processNote(eventContext, element, staveInfo);
        case 'beam' :
          return me.processBeam(eventContext, element, staveInfo);
        case 'tuplet' :
          return me.processTuplet(eventContext, element, staveInfo);
        case 'chord' :
          return me.processChord(eventContext, element, staveInfo);
        case 'clef' :
          return me.processClef(eventContext, element, staveInfo);
        case 'bTrem' :
          return me.processBTrem(eventContext, element, staveInfo);
                //case 'anchoredText' :
                //  me.processAnchoredText(eventContext, element);
                //  return;
        default :
          Logger.info('Not supported', 'Element "' + element.localName + '" is not supported. Ignoring element.');
      }
    },

        processAnchoredText: function (eventContext, element) {
    },

    /**
     * @method processNote
     */
    processNote : function (eventContext, element, staveInfo) {
      var me = this, xml_id, mei_tie, mei_slur, atts, note_opts, note, clef, vexPitch, stave, otherStave;

      atts = Util.attsToObj(element);

      mei_tie = atts.tie;
      mei_slur = atts.slur;

      xml_id = MeiLib.XMLID(element);

      atts.staff = parseInt(atts.staff);

      try {

        vexPitch = EventUtil.getVexPitch(element);

        if (atts.staff) {
          otherStave = me.allVexMeasureStaves[me.allVexMeasureStaves.length - 1][atts.staff];
          if (otherStave) {
            stave = otherStave;
            clef = me.systemInfo.getClef(atts.staff);
          } else {
            Logger.warn('Staff not found', 'No stave could be found which corresponds to @staff="' + atts.staff +
                                           '" specified in ' + Util.serializeElement(element) +
                                           '". Adding note to current stave.');
          }
        }

        if (!clef) clef = staveInfo.getClef();
        if (!stave) stave = eventContext.getStave();

        note_opts = {
          vexPitch : vexPitch,
          clef : clef,
          element : element,
          atts : atts,
          stave : stave,
          layerDir : eventContext.getLayerDir()
        };

        note = (atts.grace) ? new GraceNote(note_opts) : new Note(note_opts);

        if (otherStave) {
          eventContext.addToClefCheckQueue(note);
        }

        if (note.hasMeiStemDir && eventContext.isInBeam()) {
          eventContext.setStemDirInBeam(true);
        }

        me.processSyllables(note, element, eventContext.stave_n);


        //        // FIXME For now, we'll remove any child nodes of <note>
        //        while (element.firstChild) {
        //          element.removeChild(element.firstChild);
        //        }

        if (mei_tie) {
          me.processAttrTie(mei_tie, xml_id, vexPitch, atts.staff || eventContext.stave_n);
        }
        if (mei_slur) {
          me.processSlurAttribute(mei_slur, xml_id);
        }

        eventContext.addEvent(xml_id, {
          meiNote : element, vexNote : note
        });

        if (eventContext.clefChangeInfo) {
          EventUtil.addClefModifier(note, eventContext.clefChangeInfo);
          eventContext.setClefChangeInfo(null);
        }

        if (atts.grace) {
          eventContext.graceNoteQueue.push(note);
          return;
        } else {
          if (eventContext.graceNoteQueue.length > 0) {
            note.addModifier(0, new VF.GraceNoteGroup(eventContext.graceNoteQueue, false).beamNotes());
            eventContext.graceNoteQueue = [];
          }
        }
        return note;

      } catch (e) {
        throw new RuntimeError('An error occurred processing ' + Util.serializeElement(element) + ': "' + e.toString());
      }
    },

    /**
     * @method processChord
     */
    processChord : function (eventContext, element, staveInfo) {
      var me = this, noteElements, xml_id, chord, chord_opts, atts, i, j, mei_slur, clef, stave, otherStave;

      noteElements = element.getElementsByTagName('note');

      atts = Util.attsToObj(element);

      mei_slur = atts.slur;

      xml_id = MeiLib.XMLID(element);

      atts.staff = parseInt(atts.staff);

      try {

        if (atts.staff) {
          otherStave = me.allVexMeasureStaves[me.allVexMeasureStaves.length - 1][atts.staff];
          if (otherStave) {
            stave = otherStave;

            // TODO take clef changes in a stave into account. It might be necessary to calculate the
            // actual clef to use if there is a clef change in the measure
            clef = me.systemInfo.getClef(atts.staff);
          } else {
            Logger.warn('Staff not found', 'No stave could be found which corresponds to @staff="' + atts.staff +
                                           '" specified in ' + Util.serializeElement(element) +
                                           '". Adding note to current stave.');
          }
        }

        if (!clef) clef = staveInfo.getClef();
        if (!stave) stave = eventContext.getStave();


        chord_opts = {
          noteElements : noteElements,
          clef : clef,
          stave : stave,
          element : element,
          atts : atts,
          layerDir : eventContext.getLayerDir()
        };

        chord = (atts.grace) ? new GraceChord(chord_opts) : new Chord(chord_opts);

        if (otherStave) {
          eventContext.addToClefCheckQueue(chord);
        }

        if (chord.hasMeiStemDir && eventContext.isInBeam()) {
          eventContext.setStemDirInBeam(true);
        }

        var allNoteIndices = [];

        for (i = 0, j = noteElements.length; i < j; i++) {
          me.processNoteInChord(eventContext, i, noteElements[i], element, chord);
          allNoteIndices.push(i);
        }

        // TODO tie attribute on chord should render a tie on each note
        if (atts.tie) {
          me.processAttrTie(atts.tie, xml_id, null, atts.staff || eventContext.stave_n);
        }
        if (mei_slur) {
          me.processSlurAttribute(mei_slur, xml_id);
        }

        eventContext.addEvent(xml_id, {
          meiNote : element, vexNote : chord, index : allNoteIndices
        });

        if (eventContext.clefChangeInfo) {
          EventUtil.addClefModifier(chord, eventContext.clefChangeInfo);
          eventContext.setClefChangeInfo(null);
        }

        if (atts.grace) {
          eventContext.graceNoteQueue.push(chord);
          return;
        } else {
          if (eventContext.graceNoteQueue.length > 0) {
            chord.addModifier(0, new VF.GraceNoteGroup(eventContext.graceNoteQueue, false).beamNotes());
            eventContext.graceNoteQueue = [];
          }
        }
        return chord;
      } catch (e) {
        var xmlString = Util.serializeElement(element);
        for (i = 0, j = noteElements.length; i < j; i++) {
          xmlString += '\n    ' + Util.serializeElement(noteElements[i]);
        }
        throw new RuntimeError('A problem occurred processing \n' + xmlString + '\n</chord>\n: ' + e.toString());
      }
    },

    /**
     * @method processNoteInChord
     */
    processNoteInChord : function (eventContext, chordIndex, element, chordElement, chord) {
      var me = this, i, j, atts, xml_id;

      atts = Util.attsToObj(element);

      var vexPitch = EventUtil.getVexPitch(element);

      xml_id = MeiLib.XMLID(element);

      if (atts.tie) {
        me.processAttrTie(atts.tie, xml_id, vexPitch, parseInt(atts.staff) || eventContext.stave_n);
      }
      if (atts.slur) {
        me.processSlurAttribute(atts.slur, xml_id);
      }

      eventContext.addEvent(xml_id, {
        meiNote : chordElement, vexNote : chord, index : [chordIndex]
      });

      var childNodes = element.childNodes;
      for (i = 0, j = childNodes.length; i < j; i++) {
        switch (childNodes[i].localName) {
          case 'accid':
            atts.accid = childNodes[i].getAttribute('accid');
            break;
          case 'artic':
            EventUtil.addArticulation(chord, childNodes[i]);
            break;
          default:
            break;
        }
      }

      if (atts.accid) {
        EventUtil.processAttrAccid(atts.accid, chord, chordIndex);
      }
      if (atts.fermata) {
        EventUtil.addFermata(chord, element, atts.fermata, chordIndex);
      }
    },

    /**
     * @method processRest
     */
    processRest : function (eventContext, element, staveInfo) {
      var rest, xml_id;
      try {

        rest = new Rest({
          element : element,
          stave : eventContext.getStave(),
          clef : (element.hasAttribute('ploc') && element.hasAttribute('oloc')) ? staveInfo.getClef() : null
        });

        xml_id = MeiLib.XMLID(element);

        if (eventContext.clefChangeInfo) {
          EventUtil.addClefModifier(rest, eventContext.clefChangeInfo);
          eventContext.setClefChangeInfo(null);
        }

        if (eventContext.graceNoteQueue.length > 0) {
          rest.addModifier(0, new VF.GraceNoteGroup(eventContext.graceNoteQueue, false).beamNotes());
          eventContext.graceNoteQueue = [];
        }


        eventContext.addEvent(xml_id, {
          meiNote : element, vexNote : rest
        });
        return rest;
      } catch (e) {
        throw new RuntimeError('An error occurred processing ' + Util.serializeElement(element) + ': "' + e.toString());
      }
    },

    /**
     * @method processMRest
     */
    processMRest : function (eventContext, element, staveInfo) {
      var mRest, xml_id;

      try {
        var mRestOpts = {
          meter : staveInfo.getTimeSpec(),
          element : element,
          stave : eventContext.getStave(),
          clef : (element.hasAttribute('ploc') && element.hasAttribute('oloc')) ? staveInfo.getClef() : null
        };

        mRest = new MRest(mRestOpts);

        xml_id = MeiLib.XMLID(element);

        if (eventContext.graceNoteQueue.length > 0) {
          mRest.addModifier(0, new VF.GraceNoteGroup(eventContext.graceNoteQueue, false).beamNotes());
          eventContext.graceNoteQueue = [];
        }

        eventContext.addEvent(xml_id, {
          meiNote : element, vexNote : mRest
        });
        return mRest;
      } catch (e) {
        throw new RuntimeError('An error occurred processing ' + Util.serializeElement(element) + ': "' + e.toString());
      }
    },

    /**
     * @method processSpace
     */
    processSpace : function (eventContext, element) {
      var space = null;
      if (element.hasAttribute('dur')) {
        try {
          space = new Space({element : element, stave : eventContext.getStave()});

          if (eventContext.isInBeam()) {
            eventContext.setSpaceInBeam(true);
          }

          if (eventContext.graceNoteQueue.length > 0) {
            space.addModifier(0, new VF.GraceNoteGroup(eventContext.graceNoteQueue, false).beamNotes());
            eventContext.graceNoteQueue = [];
          }

        } catch (e) {
          throw new RuntimeError('An error occurred processing ' + Util.serializeElement(element) + ': "' +
                                 e.toString());
        }
      } else {
        Logger.info('@dur expected', 'No duration attribute in ' + Util.serializeElement(element) +
                                     '". Ignoring element.');
      }
      return space;
    },

    /**
     * @method processClef
     * @param {Object} eventContext the layer context object
     * @param {Element} element the MEI clef element
     * @param {StaveInfo} staveInfo

     */
    processClef : function (eventContext, element, staveInfo) {
      eventContext.setClefChangeInfo(staveInfo.clefChangeInMeasure(element));
    },

    /**
     * @method processBTrem
     * @param {Object} eventContext the layer context object
     * @param {Element} element the MEI bTrem element
     * @param {StaveInfo} staveInfo
     */
    processBTrem : function (eventContext, element, staveInfo) {
      var me = this;

      Logger.info('Not implemented', 'Element <bTrem> not implemented. Processing child nodes.');

      return me.processNoteLikeChildren(eventContext, element, staveInfo);

    },

    /**
     * @method processBeam
     * @param {Object} eventContext the layer context object
     * @param {Element} element the MEI beam element
     * @param {StaveInfo} staveInfo
     */
    processBeam : function (eventContext, element, staveInfo) {
      var me = this, vexNotes, filteredVexNotes, i, j, otherBeamNotes;
      eventContext.enterBeam();

      vexNotes = me.processNoteLikeChildren(eventContext, element, staveInfo);

      if (eventContext.getSpaceInBeam() === true) {
        otherBeamNotes = eventContext.shiftBeamInfoToResolve();
        if (otherBeamNotes !== undefined) {
          var combinedVexNotes = [];
          j = vexNotes.length;
          if (j !== otherBeamNotes.vexNotes.length) {
            Logger.warn('Beam content mismatch', Util.serializeElement(element) + ' and ' +
                                                 Util.serializeElement(otherBeamNotes.element) +
                                                 ' could not be combined, because their content does not match.');
          }
          for (i = 0; i < j; i++) {
            if (vexNotes[i] instanceof Space) {
              combinedVexNotes.push(otherBeamNotes.vexNotes[i]);
            } else {
              combinedVexNotes.push(vexNotes[i]);
            }
          }
          filteredVexNotes = combinedVexNotes.filter(function (element) {
            return element && element.beamable === true;
          });

        } else {
          eventContext.addBeamInfoToResolve(element, vexNotes);
        }

      } else {
        filteredVexNotes = vexNotes.filter(function (element) {
          return element.beamable === true;
        });
      }

      if (filteredVexNotes && filteredVexNotes.length > 1) {
        try {
          // set autostem parameter of VF.Beam to true if neither layerDir nor any stem direction in the beam is specified
          me.beams.addVexObject(new VF.Beam(filteredVexNotes, !eventContext.getLayerDir() &&
                                                         eventContext.getStemDirInBeam() === false));
        } catch (e) {
          Logger.error('VexFlow Error', 'An error occurred processing ' + Util.serializeElement(element) + ': "' +
                                        e.toString() + '". Ignoring beam.');
        }
      }

      eventContext.exitBeam();

      return vexNotes;
    },

    /**
     * Processes an MEI <b>tuplet</b>.
     * Supported attributes:
     *
     * - num (3 if not specified)
     * - numbase (2 if not specified)
     * - num.format ('count' if not specified)
     * - bracket.visible (auto if not specified)
     * - bracket.place (auto if not specified)
     *
     * @method processTuplet
     * @param {Object} eventContext the layer context object
     * @param {Element} element the MEI tuplet element
     * @param {MEI2VF.StaveInfo} staveInfo the stave info object
     */
    processTuplet : function (eventContext, element, staveInfo) {
      var me = this, vexNotes, tuplet, bracketPlace;

      vexNotes = me.processNoteLikeChildren(eventContext, element, staveInfo);

      if (vexNotes.length === 0) {
        Logger.warn('Missing content', 'Not content found in ' + Util.serializeElement(element) +
                                       '". Ignoring tuplet.');
        return;
      }

      tuplet = new VF.Tuplet(vexNotes, {
        num_notes : parseInt(element.getAttribute('num'), 10) || 3,
        beats_occupied : parseInt(element.getAttribute('numbase'), 10) || 2
      });

      if (element.getAttribute('num.format') === 'ratio') {
        tuplet.setRatioed(true);
      }

      tuplet.setBracketed(element.getAttribute('bracket.visible') === 'true');

      bracketPlace = element.getAttribute('bracket.place');
      if (bracketPlace) {
        tuplet.setTupletLocation((bracketPlace === 'above') ? 1 : -1);
      }

      me.tuplets.addVexObject(tuplet);
      return vexNotes;
    },

    /**
     * @method processAttrTie
     */
    processAttrTie : function (mei_tie, xml_id, vexPitch, stave_n) {
      var me = this, i, j;
      for (i = 0, j = mei_tie.length; i < j; ++i) {
        if (mei_tie[i] === 't' || mei_tie[i] === 'm') {
          me.ties.terminateTie(xml_id, {
            vexPitch : vexPitch, stave_n : stave_n
          });
        }
        if (mei_tie[i] === 'i' || mei_tie[i] === 'm') {
          me.ties.startTie(xml_id, {
            vexPitch : vexPitch, stave_n : stave_n
          });
        }
      }
    },

    /**
     * @method processSlurAttribute
     */
    processSlurAttribute : function (mei_slur, xml_id) {
      var me = this, tokens, token, i, j;
      if (mei_slur) {
        // create a list of { letter, num }
        tokens = me.parseSlurAttribute(mei_slur);
        for (i = 0, j = tokens.length; i < j; i++) {
          token = tokens[i];
          if (token.letter === 't') {
            me.slurs.terminateSlur(xml_id, {
              nesting_level : token.nesting_level
            });
          }
          if (token.letter === 'i') {
            me.slurs.startSlur(xml_id, {
              nesting_level : token.nesting_level
            });
          }
        }
      }
    },

    /**
     * @method parseSlurAttribute
     */
    parseSlurAttribute : function (slur_str) {
      var result = [], numbered_tokens, numbered_token, i, j, num;
      numbered_tokens = slur_str.split(' ');
      for (i = 0, j = numbered_tokens.length; i < j; i += 1) {
        numbered_token = numbered_tokens[i];
        if (numbered_token.length === 1) {
          result.push({
            letter : numbered_token, nesting_level : 0
          });
        } else if (numbered_token.length === 2) {
          num = +numbered_token[1];
          if (!num) {
            throw new RuntimeError('badly formed slur attribute');
          }
          result.push({
            letter : numbered_token[0], nesting_level : num
          });
        } else {
          throw new RuntimeError('badly formed slur attribute');
        }
      }
      return result;
    },

    /**
     * @method processSyllables
     */
    processSyllables : function (note, element, stave_n) {
      var me = this, i, j, syllables, vexSyllable;
      syllables = element.getElementsByTagName('syl');
      if (element.hasAttribute('syl')) {
        vexSyllable = new Syllable(element.getAttribute('syl').replace(/\s+/g, ' '), element, me.cfg.lyricsFont);
        note.addAnnotation(0, vexSyllable);
        me.page.getSystems()[me.currentSystem_n].verses.addSyllable(vexSyllable, element, stave_n);
      }
      for (i = 0, j = syllables.length; i < j; i++) {
        vexSyllable = new Syllable(Util.getNormalizedText(syllables[i]), syllables[i], me.cfg.lyricsFont);
        note.addAnnotation(0, vexSyllable);
        me.page.getSystems()[me.currentSystem_n].verses.addSyllable(vexSyllable, syllables[i], stave_n);
      }
    }

  };
/*
 * MEItoVexFlow, Interface class
 *
 * Author: Alexander Erhard
 *
 * Copyright © 2014 Richard Lewis, Raffaele Viglianti, Zoltan Komives,
 * University of Maryland
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

  window.MeiLib = MeiLib;


  window.MEI2VF = {
    /**
     * @method setLogging sets logging behavior
     * @param {String|Boolean} level If true is passed, all logging is enabled, if false, no logging will occur. The logger is off by default.
     * The following string values set logging up to the specified level:
     *
     * - true|'debug' debug messages
     * - 'info' info, e.g. unsupported elements
     * - 'warn' warnings, e.g. wrong encodings
     * - 'error' errors
     * - false no logging
     */
    setLogging : function (level) {
      Logger.setLevel.call(Logger, level);
    },
    /**
     * @method setLoggerAppender sets the logger's appender
     * @param appender an object implementing the methods error(), warn(), info() and debug(), for example window.console
     */
    setLoggerAppender : function (appender) {
      Logger.setAppender.call(Logger, appender);
    },
    /**
     * The methods in Converter can be used to manually address distinct
     * processing steps and retrieve the created data. Can be used in
     * addition or as a supplement to {@link render_notation} and
     * {@link rendered_measures}
     */
    Converter : {
      /**
       * initializes the converter
       * @method initConfig
       * @param {Object} config The options passed to the converter. For a list, see
       * {@link MEI2VF.Converter#defaults}
       */
      initConfig : function (config) {
        Converter.prototype.initConfig(config);
      },
      /**
       * Resets the conversion results data to its initial state. Call this before process()
       * @method reset
       */
      reset : function () {
        Converter.prototype.reset();
      },
      /**
       * Processes the specified MEI document or document fragment. The generated
       * objects can be processed further or drawn immediately to a canvas via
       * {@link #draw}.
       * @method process
       * @param {XMLDocument} xmlDoc the XML document
       */
      process : function (xmlDoc) {
        Converter.prototype.process(xmlDoc);
      },
      /**
       * Formats the processed data
       * @method format
       * @param ctx The canvas context
       */
      format : function (ctx) {
        Converter.prototype.format(ctx);
      },
      /**
       * Draws the processed data to a canvas
       * @method draw
       * @param ctx The canvas context
       */
      draw : function (ctx) {
        Converter.prototype.draw(ctx);
      },
      /**
       * returns a 2d array of all Vex.Flow.Stave objects, arranged by
       * [measure_n][stave_n]
       * @method getAllVexMeasureStaffs
       * @return {Vex.Flow.Stave[][]} see {@link MEI2VF.Converter#allVexMeasureStaves}
       */
      getAllVexMeasureStaffs : function () {
        return Converter.prototype.getAllVexMeasureStaves();
      },
      /**
       * Returns the width and the height of the area that contains all drawn
       * staves as per the last processing.
       *
       * @method getStaffArea
       * @return {Object} the width and height of the area that contains all staves.
       * Properties: width, height
       */
      getStaffArea : function () {
        return Converter.prototype.getStaveArea();
      }
    },
    /**
     * Contains all Vex.Flow.Stave objects created when calling {@link #render_notation}.
     * Addressing scheme: [measure_n][stave_n]
     * @property {Vex.Flow.Stave[][]} rendered_measures
     */
    rendered_measures : null,
    /**
     * Main rendering function.
     * @param {XMLDocument} xmlDoc The MEI XML Document
     * @param {Element} target An svg or canvas element
     * @param {Number} width The width of the print space in pixels. Defaults to 800 (optional)
     * @param {Number} height The height of the print space in pixels. Defaults to 350 (optional)
     * @param {Number} backend Set to Vex.Flow.Renderer.Backends.RAPHAEL to
     * render to a Raphael context, to Vex.Flow.Renderer.Backends.SVG to use SVG;
     * if falsy, Vex.Flow.Renderer.Backends.CANVAS is set
     * @param {Object} options The options passed to the converter. For a list, see
     * {@link MEI2VF.Converter MEI2VF.Converter}
     * @param {Function} callback
     */
    render_notation : function (xmlDoc, target, width, height, backend, options, callback) {
      var ctx;
      var cfg = options || {};

      ctx = new VF.Renderer(target, backend || VF.Renderer.Backends.CANVAS).getContext();

//      width = null;
//      height = null;

      cfg.pageWidth = width;

      this.Converter.initConfig(cfg);
      this.Converter.reset();
      this.Converter.process(xmlDoc[0] || xmlDoc);

      this.Converter.format(ctx);

      // if height is specified don't return the calculated height to get same behavior as width
      if (height) {
        this.calculatedHeight = null;
      } else {
        this.calculatedHeight = Converter.prototype.pageInfo.getCalculatedHeight();
      }
      if (Converter.prototype.pageInfo.hasCalculatedWidth()) {
        this.calculatedWidth = Converter.prototype.pageInfo.getCalculatedWidth();
      } else {
        this.calculatedWidth = null;
      }

      if (+backend === VF.Renderer.Backends.RAPHAEL) {
        ctx.paper.setSize(this.calculatedWidth || width, this.calculatedHeight || height);
      }

      if (callback) {
        callback(this.calculatedHeight, this.calculatedWidth);
      }

      this.Converter.draw(ctx);
      this.rendered_measures = this.Converter.getAllVexMeasureStaffs();

    }
  };


})(jQuery, Vex.Flow);
