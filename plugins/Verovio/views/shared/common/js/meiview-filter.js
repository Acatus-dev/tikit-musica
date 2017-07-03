/***
* meiview.js
* Author: Zoltan Komives
*
* Copyright © 2013 Zoltan Komives
*
* Licensed under the Apache License, Version 2.0 (the "License"); you
* may not use this file except in compliance with the License.  You may
* obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
* implied.  See the License for the specific language governing
* permissions and limitations under the License.
***/


/**
 * MeiFilter is responsible to transform an 'arbitrary' MEI file into an
 * MEI file that can be presented with meiView
 *
 */
 meiView = (typeof meiView == "undefined")? {} : meiView;
/*
meiView.substituteLonga = function(music) {
  var longs = $(music).find('note[dur="long"]');
  $(longs).each(function(){
    //TODO: for now we simply replace longas with breve
    // much better would be to introduce long in VexFlow
    $(this).attr('dur', 'breve');
  })
}
*/
meiView.filterMei = function(meiXml, options) {
  var options = options || {};

  /**
   * Propagate relevant attribute values from scoreDef into staffDef elements
   */
   var propagateScoreDefAttrs = function(scoreDef) {

    var propagateAttrValue = function(attrname, descendant, ancestor) {
      var desc_attr_val = $(descendant).attr(attrname);
      var anc_attr_val = $(ancestor).attr(attrname);
      if (!desc_attr_val && anc_attr_val) {
        $(descendant).attr(attrname, anc_attr_val);
      }
    }

    var staffDefs = $(scoreDef).find('staffDef');
    $(staffDefs).each(function() {
      propagateAttrValue('meter.count', this, scoreDef);
      propagateAttrValue('meter.unit', this, scoreDef);
      propagateAttrValue('meter.rend', this, scoreDef);
      propagateAttrValue('key.pname', this, scoreDef);
      propagateAttrValue('key.accid', this, scoreDef);
      propagateAttrValue('key.mode', this, scoreDef);
      propagateAttrValue('key.sig.show', this, scoreDef);
    });
  }

  /**
   * If the scoreDef doesn't have children, look up the
   * previous scoreDef within the current score element,
   * and copy its content.
   */
   var completeScoreDef = function(scoredef, current) {
    if ($(scoredef).find('staffDef').length == 0) {
      if (!current) {
        current = scoredef;
      }
      var prev = $(current).prev();
      if (prev.length > 0 && prev[0].localName == 'scoreDef') {
        $(prev).children().each(function() {
          $(scoredef).append(this.cloneNode(true));
        });
      } else if (prev.length > 0) {
        completeScoreDef(scoredef, prev[0])
      } else {
        var parent = $(current)[0].parentNode;
        if ( parent && parent.localName != 'score' ) {
          completeScoreDef(scoredef, parent);
        }
      }

    }
  }

  var eliminateAccidElements = function(music) {

    var eliminateAccid = function(accid) {

      var place_val = $(accid).attr('place');
      var func_val = $(accid).attr('func');

      if ( place_val == 'above' && func_val == 'edit' ) {

        var parent_note_id = $(accid).parent('supplied').parent('note').attr('xml:id');
        if (!parent_note_id) {
          console.log('parent note xml:id is needed in order to attach ficta. Ficta will be ignored.');
        } else {
          var dir = meiXml.createElementNS('http://www.music-encoding.org/ns/mei', 'dir');
          $(dir).attr('startid', parent_note_id);
          var accid_val = $(accid).attr('accid');
          if (accid_val == 's') {
            $(dir).append('&#9839;');
          } else if (accid_val == 'n') {
            $(dir).append('&#9838;');
          } else if (accid_val == 'f') {
            $(dir).append('&#9837;');
          }
          $(accid).closest('staff').get(0).parentNode.appendChild(dir);
        }

      } else {
        $(accid).parent('note').attr('accid', $(accid).attr('accid'));
      }

      accid.parentNode.removeChild(accid);
    }

    var accids = $(music).find('accid');
    $(accids).each(function() {
      eliminateAccid(this);
    });

  }

  var music = meiXml.getElementsByTagNameNS("http://www.music-encoding.org/ns/mei", 'music')[0];

  //1. Remove page break elements (<pb>)
  $(music).find('pb').remove();
  $(music).find('sb').remove();

  var scoreDefs = $(music).find('scoreDef');

  //2. Complete partial scoreDefs
  $(scoreDefs).each(function() {
    completeScoreDef(this);
  });

  //3. Propagate meter and key signatures from score def to staff def
  $(scoreDefs).each(function() {
    propagateScoreDefAttrs(this);
  });

  //3. Remove system breaks if not needed.
  if (options.noSysBreak) {
    $(music).find('sb').remove();
  }

  if (options.noMeterSig) {
    $(music).find('meterSig').remove();
  }

  //4. Substitue longas with breves
  // meiView.substituteLonga(music);

  eliminateAccidElements(music);
  //MBO suppresion annot
  //$(music).find('annot').remove();
  //$(music).find('line').remove();

  $(music).find('measure').each(function() {
    var n = $(this).attr('n');
    //console.info(n);
  });

//BC remove <app><rdg></rdg></app> if only <app> has one child <rdg>
//and append <rdg> content to the measure
$(music).find('app').each(function(index,element){
  if($(element).children().length == 1 &&  $(element).find('rdg')){
    if($(element).find('rdg').find('staff')){
      $(this).parent().append($(element).find('rdg').children()[0]);
      $(this).remove();
    }
  }
});

//BC displays the missing notes 
$(music).find('lem').each(function(index,element){
  if($(element).children()[0].nodeName == "choice"){
    $(element).append($(element).find('sic').children());
  }
});

//BC remove slur
$(music).find('slur').remove();

//MBO
/*
  var ter = $(music).find('note[dots]');
  $(ter).each(function(){
	switch($(this).attr("dur")){
		case "1":
			$(this).attr("dur","4");
			break;
		case "2":
			$(this).attr("dur","1");
			break;
		case "4":
			$(this).attr("dur","2");
			break;
		default:
			break;
	}
});*/
return meiXml;
}
