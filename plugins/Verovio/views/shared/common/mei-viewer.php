
<script type="text/JavaScript" src="<?php echo public_url('plugins/MEIViewer/views/shared/common/js/jquery.min.js');?>"></script>
<script src="<?php echo public_url('plugins/MEIViewer/views/shared/common/js/verovio-toolkit.js');?>" type="text/javascript" ></script>


<script type="application/javascript" language="javascript">

//jQuery(document).ready(function () {
var file = <?php echo js_escape($docs[0]->getWebPath('original')); ?>;
        
            ///////////////////////////
            /* Create the vrvToolkit */
            ///////////////////////////
            var vrvToolkit = new verovio.toolkit();
            
            ////////////////////////////////////
            /* Load the file using a HTTP GET */
            ////////////////////////////////////
            $.ajax({
                url: file
                , dataType: "text"
                , success: function(data) {
                    var svg = vrvToolkit.renderData( data + "\n" );
                    $(".mei-content").html(svg);
                }
            });
	//		}
        </script>

<script type="text/JavaScript" src="<?php echo public_url('plugins/MEIViewer/views/shared/common/css/bootstrap/js/bootstrap.min.js');?>"></script>
<div id="mei-view">
  <div id="mei-content">
  </div>
</div>

