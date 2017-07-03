<?php 
/*  Copyright 2011  Patrick Galbraith  (email : patrick.j.galbraith@gmail.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as 
    published by the Free Software Foundation. 

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

class TruncateHTML {
    
    var $charCount = 0;
    var $wordCount = 0;
    var $limit;
    var $startNode;
    var $ellipsis;
    var $foundBreakpoint = false;
    
    private function init($html, $limit, $ellipsis) {
        
        $dom = new DOMDocument();
        $dom->loadHTML($html);
        
        $this->startNode = $dom->getElementsByTagName("body")->item(0); //the body tag node, our html fragment is automatically wrapped in a <html><body> etc... skeleton which we will strip later
        $this->limit = $limit;
        $this->ellipsis = $ellipsis;
        $this->charCount = 0;
        $this->wordCount = 0;
        $this->foundBreakpoint = false;
        
        return $dom;
    }
    
    public function truncateChars($html, $limit, $ellipsis = '...') {
        
        if($limit <= 0 || $limit >= strlen(strip_tags($html)))
            return $html;
        
        $dom = $this->init($html, $limit, $ellipsis);
        
        $this->domNodeTruncateChars($this->startNode); //pass the body node on to be processed
        
        return preg_replace('~<(?:!DOCTYPE|/?(?:html|head|body))[^>]*>\s*~i', '', $dom->saveHTML()); //hack to remove the html skeleton that is added, unfortunately this can't be avoided unless php > 5.3
    }
    
    public function truncateWords($html, $limit, $ellipsis = '...') {
        
        if($limit <= 0 || $limit >= $this->countWords(strip_tags($html)))
            return $html;
        
        $dom = $this->init($html, $limit, $ellipsis);
        
        $this->domNodeTruncateWords($this->startNode); //pass the body node on to be processed
        
        return preg_replace('~<(?:!DOCTYPE|/?(?:html|head|body))[^>]*>\s*~i', '', $dom->saveHTML()); //hack to remove the html skeleton that is added, unfortunately this can't be avoided unless php > 5.3
    }
    
    private function domNodeTruncateChars(DOMNode $domNode) {

        foreach ($domNode->childNodes as $node) {
            
            if($this->foundBreakpoint == true) return;
            
            if($node->hasChildNodes()) {
                $this->domNodeTruncateChars($node);
            } else {            
                if(($this->charCount + strlen($node->nodeValue)) >= $this->limit) {
                    //we have found our end point
                    $node->nodeValue = substr($node->nodeValue, 0, $this->limit - $this->charCount);
                    $this->removeProceedingNodes($node);
                    $this->insertEllipsis($node);
                    $this->foundBreakpoint = true;
                    return;
                } else {
                    $this->charCount += strlen($node->nodeValue);
                }
            }
        }
    }
    
    private function domNodeTruncateWords(DOMNode $domNode) {

        foreach ($domNode->childNodes as $node) {
            
            if($this->foundBreakpoint == true) return;
            
            if($node->hasChildNodes()) {
                $this->domNodeTruncateWords($node);
            } else {
                $curWordCount = $this->countWords($node->nodeValue);
                
                if(($this->wordCount + $curWordCount) >= $this->limit) {
                    //we have found our end point
                    if($curWordCount > 1 && ($this->limit - $this->wordCount) < $curWordCount) {
                        $words = preg_split("/[\n\r\t ]+/", $node->nodeValue, ($this->limit - $this->wordCount) + 1, PREG_SPLIT_NO_EMPTY|PREG_SPLIT_OFFSET_CAPTURE);
                        end($words);
                        $last_word = prev($words);
                        $node->nodeValue = substr($node->nodeValue, 0, $last_word[1] + strlen($last_word[0]));
                    }
                    
                    $this->removeProceedingNodes($node);
                    $this->insertEllipsis($node);
                    $this->foundBreakpoint = true;
                    return;
                } else {
                    $this->wordCount += $curWordCount;
                }
            }
        }
    }
    
    private function removeProceedingNodes(DOMNode $domNode) {        
        $nextNode = $domNode->nextSibling;
        
        if($nextNode !== NULL) {
            $this->removeProceedingNodes($nextNode);
            $domNode->parentNode->removeChild($nextNode);
        } else {
            //scan upwards till we find a sibling
            $curNode = $domNode->parentNode;
            while($curNode !== $this->startNode) {
                if($curNode->nextSibling !== NULL) {
                    $curNode = $curNode->nextSibling;
                    $this->removeProceedingNodes($curNode);
                    $curNode->parentNode->removeChild($curNode);
                    break;
                }
                $curNode = $curNode->parentNode;
            }
        }
    }
    
    private function insertEllipsis(DOMNode $domNode) {    
        $avoid = array('a', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5'); //html tags to avoid appending the ellipsis to
        
        if( in_array($domNode->parentNode->nodeName, $avoid) && ($domNode->parentNode->parentNode !== NULL || $domNode->parentNode->parentNode !== $this->startNode)) {
            // Append as text node to parent instead
            $textNode = new DOMText($this->ellipsis);
            
            if($domNode->parentNode->parentNode->nextSibling)
                $domNode->parentNode->parentNode->insertBefore($textNode, $domNode->parentNode->parentNode->nextSibling);
            else
                $domNode->parentNode->parentNode->appendChild($textNode);
        } else {
            // Append to current node
            $domNode->nodeValue = rtrim($domNode->nodeValue).$this->ellipsis;
        }
    }
    
    private function countWords($text) {
        $words = preg_split("/[\n\r\t ]+/", $text, -1, PREG_SPLIT_NO_EMPTY);
        return count($words);
    }
}