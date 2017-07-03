<?php $view = get_view(); ?>
<fieldset>
  <legend><?php echo __('General Settings'); ?></legend>
  <div class="field">
    <div class="two columns alpha">
        <label for="default_zoom"><?php echo __('Default zoom'); ?></label>
    </div>
    <div class="inputs five columns omega">
        <p class="explanation"><?php echo __("Zoom par défaut sur la visionneuse de partitions"); ?></p>
        <?php echo $view->formText('default_zoom', get_option('verovio_default_zoom')); ?>
    </div>
  </div>
  <div class="field">
    <div class="two columns alpha">
        <label for="default_height"><?php echo __('Default height'); ?></label>
    </div>
    <div class="inputs five columns omega">
        <p class="explanation"><?php echo __("Hauteur par défaut de la visionneuse"); ?></p>
        <?php echo $view->formText('default_height', get_option('verovio_default_height')); ?>
    </div>
  </div>
</fieldset>
