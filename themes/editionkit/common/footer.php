</div><!-- end content -->

<footer role="contentinfo">
    <nav role="navigation" class="navigation">
        <ul>
            <li>
                <a href="<?php echo public_url('privacy'); ?>">Privacy Policy</a>
            </li>
            <li>
                <a href="<?php echo public_url('contact'); ?>">Contact us</a>
            </li>
        </ul>
        <div class="navigation foot-left">
             <a href="#">TiKiT•MUSICA</a><br />
 proposed by : <a href="http://www.cesr.cnrs.fr/"> The Center of Renaissance Studies and The University of Tours (France)</a><br /> <a href="http://ricercar.cesr.univ-tours.fr/"> Ricercar Programme </a><br />
              <a href="http://musica.hypotheses.org/"> Consortium Musica and</a> <a href="https://humanum.hypotheses.org/"> TGIR•HUMANUM </a><br />
            developped by <a href="http://www.acatus.fr">ACATUS Informatique</a>
        </div>
    </nav>

    <?php fire_plugin_hook('public_footer', array('view' => $this)); ?>

</footer>

</div><!--end wrap-->

<script type="text/javascript">
jQuery(document).ready(function () {
    Omeka.showAdvancedForm();
    Omeka.skipNav();
    Omeka.megaMenu("#top-nav");
    EditionKit.mobileSelectNav();
});
</script>

</body>

</html>
