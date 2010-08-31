/* Copyright (c) 2010 John McCollum / 360innovate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Disclaimer: I am most certainly not holding this up to be an example of beautiful code - this was my entry to http://10k.aneventapart.com.

*/

(function($){
            // counts the number of occurrences of x in the array. Doesn't check types!
            // eg [1,2,3,4,5].occ(2) == 1 -> True
            Array.prototype.occ = function(x){
                var c = 0;
                for(var i=0;i<this.length;i++){
                    if(this[i]==x){ c++; }
                }
                return c;
            };
            
            // GS stands for growshrink! Which is what this plugin does to the passed selector.
            $.fn.gs = function(){
                return this.each(function(){
                        var o = $(this).css('fontSize');
                        $(this).animate({'fontSize':'36px'},300).delay(750).animate({'fontSize':o},300);
                });
            };

            // deal animation. Call on each individual card.
            $.fn.da = function(i,txt){
                return this.each(function(){
                    if(!$('#c'+i).data('held')){
                        var tm = $('<div/>',{
                            'class':'dr cc',
                            'css': {'position':'absolute','top':$('.dr:first').offset().top}
                        });
                        $('#c0').before(tm);
                        setTimeout(function(){
                            tm.animate({
                                top:$('#c'+i).offset().top-20,
                                left:$('#c'+i).offset().left
                            },600,'swing',function(){
                                setTimeout(function(){
                                    var num = txt.substring(0,txt.length-1);
                                    var suit = txt.substring(txt.length-1);
                                    var c = (suit=='H'||suit=='D') ? 'r':'';
                                    $('#c'+i).css('background', '#fff').html('<span class="tl '+c+'">'+num+'</span><span class="tr '+c+'"">'+num+'</span><span class="s '+c+'"">'+suitsh[suits.indexOf(suit)]+'</span><span class="bl '+c+'">'+num+'</span><span class="br '+c+'"">'+num+'</span>');
                                    tm.fadeOut(function(){ $(this).remove() });    
                                },i*200)
                            });
                        },i*120);
                    }
                });
            };
            
            // Aces are high + low for the purpose of straights, hence they are in cardNums twice.
            // when dealing, the top ace isn't taken into account, so there's no more chance of getting an Ace than any other card.
            var cardNums = ['A','2','3','4','5','6','7','8','9','10','J','Q','K','A'], suits = ['H','D','C','S'], suitsh = ['&hearts;','&diams;','&clubs;','&spades;'];
            
            var hand = function(){
                this.cards = []; // Tracks current cards
                this.discarded = []; // cards that the user has discarded on hitting 'draw'
                this.winMethod = ''; // tracks the current winning combination (if there is one)
                this.stake = 0; // Amount that the player is betting
                this.multiplier = 0; // Based on the type of win the user has had.
                
                // Takes place on hitting 'deal'
                this.deal = function(stake){
                    if(stake!==undefined){
                        this.stake=stake;
                    }
                    for(var i=0;i<5;i++){
                        if(this.cards[i]===null||!this.cards[i]){
                           var card = this.generateCard();
                           while($.inArray(card,this.cards)>-1 || $.inArray(card,this.discarded)>-1){
                                    card=this.generateCard();
                           }
                           this.cards[i]=card;
                        }
                    }
                    
                    $('#d').unbind()
                        .removeClass('deal')
                        .addClass('draw')
                        .text('Draw')
                        .click($.proxy(this.draw,this));
                    
                    $('#s').attr('disabled','disabled');
                    
                    $.each(this.cards, function(i,card){
                        $('#c'+i).da(i,card).data('card',card);      
                    });
                    return this;
                };
                
                this.generateCard = function(){
                        // note that this is one less than cardNums.length, since Ace is in there twice.
                        return cardNums[Math.floor(Math.random()*13)]+suits[Math.floor(Math.random()*4)];
                };
                
                this.draw = function(){
                    var cs = $('.c');
                    for(var i=0;i<5;i++){
                        var c=$(cs[i]);
                        if(!c.data('held')){
                            var cn = c.data('card');
                            this.discarded.push(cn);
                            this.cards[this.cards.indexOf(cn)]=null;
                        }
                    }
                    this.deal();
                    this.evaluate();
                    this.cleanup();
                };
                
                // check to see if we have a winning hand.
                this.evaluate = function(){
                    var w='',m=0;
                    if(this.isRoyalFlush()){
                        w='a Royal Flush';m=100;
                    }else if(this.isStraightFlush()){
                        w='a Straight Flush';m=30;
                    }else if(this.isNOfAKind(4)){
                        w='a 4 of a kind';m=20;
                    }else if(this.isFullHouse()){
                        w='a Full House';m=10;
                    }else if(this.isFlush()){
                        w='a Flush';m=7;
                    }else if(this.isStraight()){
                        w='a Straight';m=5;
                    }else if(this.isNOfAKind(3)){
                        w='a 3 of a kind';m=4;
                    }else if(this.isTwoPair()){
                        w='Two Pair';m=3;
                    }else if(this.isJob()){
                        w='Jacks or Better';m=2;
                    }
                    this.winMethod=w;this.multiplier=m;
                };
                
                this.isRoyalFlush = function(){
                    var c = this.cards,s=c[0].substring(c[0].length-1),i=$.inArray;
                    // Oh dear
                    return this.isFlush()&&(i('A'+s,c)>-1&&i('K'+s,c)>-1&&i('Q'+s,c)>-1&&i('J'+s,c)>-1&&i('10'+s,c)>-1);
                };
                this.isStraightFlush = function(){
                    return this.isFlush() && this.isStraight();
                };
                this.isNOfAKind = function(n){
                    // works for 2,3 and 4 of a kind.
                    var cn = this.getCardNums();
                    for(var i=0;i<4;i++){ if(cn.occ(cn[i])===n){return true;}}
                    return false;
                };
                this.isFullHouse = function(){
                    var cn = this.getCardNums(),cp = [];
                    for(var i=0;i<3;i++){
                        if(cn.occ(cn[i])==3){
                            $.each(cn, function(j,it){
                                if(it!=cn[i]){
                                    cp.push(it);
                                }
                            });
                            return cp.occ(cp[0])===2;
                            break;
                        }
                    }
                    return false;
                };
                this.isFlush = function(){
                    var c=this.cards,s=[];
                    $.each(c,function(i,card){ s.push(card.substring(card.length-1)); });
                    return s.occ(s[0])===5;
                };
                this.isStraight = function(){
                    var c = this.getCardNums();
                    for(var i=0;i<5;i++){
                        var cn = cardNums, card = c[i],s = cn.slice(cn.indexOf(card), cn.indexOf(card)+5);
                        if(s.length===5){
                            if(c.occ(s[0])===1&&c.occ(s[1])===1&&c.occ(s[2])===1&&c.occ(s[3])===1&&c.occ(s[4])===1){
                                return true;
                            }
                        }
                    }
                    return false;
                };
                this.isTwoPair = function(){
                    var c = this.getCardNums(),cp=[];
                    for(var i=0;i<4;i++){
                        if(c.occ(c[i])===2){
                            $.each(c, function(j,it){
                                if(it!=c[i]){
                                    cp.push(it);
                                }
                            });
                            break;
                        }
                    }
                    return cp.occ(cp[0])===2||cp.occ(cp[1])===2;
                };
                
                // Jacks or better
                this.isJob = function(){
                    var c = this.getCardNums();
                    return (c.occ('J')==2||c.occ('Q')==2||c.occ('K')==2||c.occ('A')==2);
                };
                
                this.getCardNums = function(){
                    var cn=[], c=this.cards;
                    for(var i=0;i<5;i++){
                        cn.push(c[i].substring(0,c[i].length-1));
                    }
                    return cn;
                };
                
                this.cleanup = function(){
                        setTimeout($.proxy(function(){
                                if(this.winMethod){
                                    var oldCash = game.cash,newCash = parseInt(game.cash + (this.stake*this.multiplier),10);
                                    game.cash = newCash;
                                    $('#m').text('$'+game.cash.toString()).gs();
                                    $('#w').html('You won $'+(newCash-oldCash).toString()+' thanks to a '+this.winMethod+'! <br />Choose your stake and hit deal to play again.');
                                    var f=false;
                                }else{
                                    $('#w').text("You didn't win this time. Please try again!");
                                    var f = this.checkFinished();
                                }
        
                                $('.c').unbind().css('background','#fff').data('held',false);
                                
                                if(!f){
                                    $('#d').unbind()
                                    .removeClass('draw')
                                    .addClass('deal')
                                    .text('Deal')
                                    .click(function(event){game.start(event,newCash);});
                                }
                                
                                $('#s').attr('disabled','');    
                        },this),2100);
                };
                
                this.checkFinished = function(){
                        if(!game.cash){
                            $('#d').unbind();
                            $('#w').text("You're out of cash! Hit refresh to try again.");
                            return true;
                        }
                        return false;
                };
            };
            
            var game = {
                cash: 1000,
                start: function(event,cash){
                    $('#w').text('');
                    var s = $('#s').val();
                    s=parseInt(s.substring(0, s.length),10);
                    if(s>game.cash){
                        $('#w').text("Please lower your stake. Your stake can't be more than your pot!");
                    }else if(s<=0){
                        $('#w').text("Please make sure your stake is at least $1!");
                    }else{
                        if(cash!==undefined){
                            game.cash=cash-s;
                        }else{
                            game.cash=game.cash-s;
                        }
                    
                        $('#m').text('$'+game.cash.toString()).gs(); 
                    
                        $('.c').toggle(function(){
                            $(this).data('held',true).css('background','#A5A5A5');
                        },
                        function(){
                            $(this).data('held',false).css('background','#fff');
                        });
                    
                        var h = new hand();
                        h.deal(s);
                        h.evaluate();
                        if(h.winMethod){
                            var add = '<br />(You currently have '+ h.winMethod +', you should probably hold those cards!)';
                        }else{
                            var add = '';
                        }
                        $('#w').html('Click to hold cards that might make up one of the winning hands, then hit draw. ' + add);
                    }
                }
            };
            
            $(function(){
                $('#d').click(game.start);
            });
})(jQuery);