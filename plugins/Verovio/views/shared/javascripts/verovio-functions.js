// Navigation

function first_page() {
	page = 1;
	load_page();
};

function last_page() {
	page = vrvToolkit.getPageCount();
	load_page();
};

function next_page() {
	if (page >= vrvToolkit.getPageCount()) {
		return;
	}

	page = page + 1;
	load_page();
};

function prev_page() {
	if (page <= 1) {
		return;
	}

	page = page - 1;
	load_page();
};


function do_page_enter(e) {
		key = e.keyCode || e.which;
		if (key == 13) {

				text = $("#jump_text").val();

				if (text <= vrvToolkit.getPageCount() && text > 0) {
						page = Number(text);
						load_page();
				} else {
						$("#jump_text").val(page);
				}

		}
};


// Zoom
function zoom_in() {
	if (zoom >= 100) {
		return;
	}

	zoom = zoom + 20;
	update_viewer();
};

function zoom_out() {
	if (zoom <= 20) {
		return;
	}

	zoom = zoom - 20;
	update_viewer();
};

function do_zoom_enter(e) {
		key = e.keyCode || e.which;
		if (key == 13) {
				text = $("#zoom_text").val();
				zoom_val = Number(text.replace("%", ""));
				if (zoom_val < 10) zoom_val = 10;
				else if (zoom_val > 160) zoom_val = 160;
				zoom = zoom_val;
				update_viewer();
		}
};

// Viewer's height
function height_minus() {
	if (pageHeight <= 400) {
		return;
	}
	nbPagesTotActuel = vrvToolkit.getPageCount();
	while (nbPagesTotActuel == vrvToolkit.getPageCount() && pageHeight > 400) {
		pageHeight = pageHeight - 200;
		set_options();
		vrvToolkit.redoLayout();
	}
	update_viewer();
};

function height_more() {
	nbPagesTotActuel = vrvToolkit.getPageCount();
	if (nbPagesTotActuel == 1) {
		return;
	}
	while (nbPagesTotActuel == vrvToolkit.getPageCount()) {
		pageHeight = pageHeight + 200;
		set_options();
		vrvToolkit.redoLayout();
	}
	update_viewer();
};

// Fullscreen
function fullscreen() {
	if ($("#meiviewer").hasClass("fullscreen")) {
		$("#meiviewer").removeClass("fullscreen");	
	} else {
		$("#meiviewer").addClass("fullscreen");
	}
	update_viewer();
}

// Swipe

function swipe_prev(event, direction, distance, duration, fingerCount) {
          prev_page();
}

function swipe_next(event, direction, distance, duration, fingerCount) {
	next_page();
}

function swipe_zoom_in(event, target) {
	zoom_in();
}

function swipe_zoom_out(event, target) {
	zoom_out();
}

function enable_swipe( pages ) {
	if ( pages && !swipe_pages ) {
		$("#output").swipe( "destroy" );
		$("#output").swipe( { swipeLeft: swipe_next, swipeRight: swipe_prev, tap: swipe_zoom_in, doubleTap: swipe_zoom_out, allowPageScroll:"auto"} );
		swipe_pages = true;
	}
	// zoom only
	else if ( !pages && swipe_pages ) {
		$("#output").swipe( "destroy" );
		$("#output").swipe( { tap: swipe_zoom_in, doubleTap: swipe_zoom_out, allowPageScroll:"auto"} );
		swipe_pages = false;        
	}
}



function update_viewer() {
	set_options();
	vrvToolkit.redoLayout();

	$("#total_text").html(vrvToolkit.getPageCount());
	page = 1;
	load_page();
};

// Fonctions générales

function set_options( ) {
		pageWidth =  $("#output").width()  * 100 / zoom   ;
		border = 50;
		options = JSON.stringify({
				 inputFormat: "mei",
				 pageHeight: pageHeight,
				 pageWidth: pageWidth,
				 border: border,
				 scale: zoom,
				 adjustPageHeight: 1,
				 ignoreLayout: 1,
				 type: "svg",
				 page: 1
			 });
		vrvToolkit.setOptions( options );
};

function adjust_page_height() {
    // adjust the height of the panel
    if ( $('#svg_panel svg') ) {
        zoomed_height = pageHeight * zoom / 100;
        if ( zoomed_height < $('#svg_panel svg').height() ) {
            zoomed_height = $('#svg_panel svg').height();
        }
        $('#svg_output').height( zoomed_height ); // slighly more for making sure we have no scroll bar    
        //$('#svg_panel svg').height(pageHeight * zoom / 100 );
        //$('#svg_panel svg').width(pageWidth * zoom / 100 );    
    }
    
    // also update the zoom control
    $("#zoom_text").val(zoom + "%");
    
    // enable the swipe (or not)
    enable_swipe( ( $('#svg_panel svg') && ( $('#svg_panel svg').width() <= $('#svg_panel').width() ) ) );
};

function load_data(data) {
		set_options();
		vrvToolkit.loadData(data);

		page = 1;
		load_page();
};

function load_page() {
		$("#total_text").html(vrvToolkit.getPageCount());
		$("#jump_text").val(page);
		$("#zoom_text").val(zoom + "%");
		$("#height_viewer").val(pageHeight);

		svg = vrvToolkit.renderPage(page, "");
		$("#output").html(svg);
		adjust_page_height();
};

function load_file(file) {
		$.ajax({
				url: file
				, dataType: "text"
				, success: function(data) {
						load_data(data);
				}
		});
};
